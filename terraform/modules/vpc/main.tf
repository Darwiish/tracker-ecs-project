# Select available AZs instead of hardcoding names.
data "aws_availability_zones" "available" {
	state = "available"
}

# Limit the network to the requested number of AZs.
locals {
	availability_zones = slice(data.aws_availability_zones.available.names, 0, var.availability_zone_count)
}

# Enable DNS support and hostnames for private AWS service access.
resource "aws_vpc" "main" {
	cidr_block           = var.vpc_cidr
	enable_dns_support   = true
	enable_dns_hostnames = true

	tags = {
		Name = "${var.project_name}-vpc"
	}
}

# Provide internet access only to public subnets.
resource "aws_internet_gateway" "main" {
	vpc_id = aws_vpc.main.id

	tags = {
		Name = "${var.project_name}-igw"
	}
}

# Public subnets provide internet facing network placement.
resource "aws_subnet" "public" {
	count = var.availability_zone_count

	vpc_id                  = aws_vpc.main.id
	availability_zone       = local.availability_zones[count.index]
	cidr_block              = var.public_subnet_cidrs[count.index]
	map_public_ip_on_launch = true

	tags = {
		Name = "${var.project_name}-public-${count.index + 1}"
		Tier = "public"
	}
}

# Application subnets remain private and receive no public IPs.
resource "aws_subnet" "private_application" {
	count = var.availability_zone_count

	vpc_id                  = aws_vpc.main.id
	availability_zone       = local.availability_zones[count.index]
	cidr_block              = var.private_application_subnet_cidrs[count.index]
	map_public_ip_on_launch = false

	tags = {
		Name = "${var.project_name}-private-app-${count.index + 1}"
		Tier = "private-application"
	}
}

# Database subnets remain private and receive no public IPs.
resource "aws_subnet" "private_database" {
	count = var.availability_zone_count

	vpc_id                  = aws_vpc.main.id
	availability_zone       = local.availability_zones[count.index]
	cidr_block              = var.private_database_subnet_cidrs[count.index]
	map_public_ip_on_launch = false

	tags = {
		Name = "${var.project_name}-private-db-${count.index + 1}"
		Tier = "private-database"
	}
}

# Route public subnet internet traffic through the IGW.
resource "aws_route_table" "public" {
	vpc_id = aws_vpc.main.id

	route {
		cidr_block = "0.0.0.0/0"
		gateway_id = aws_internet_gateway.main.id
	}

	tags = {
		Name = "${var.project_name}-public-rt"
	}
}

resource "aws_route_table_association" "public" {
	count = var.availability_zone_count

	subnet_id      = aws_subnet.public[count.index].id
	route_table_id = aws_route_table.public.id
}

resource "aws_route_table" "private_application" {
	count = var.availability_zone_count

	vpc_id = aws_vpc.main.id

	tags = {
		Name = "${var.project_name}-private-app-rt-${count.index + 1}"
	}
}

resource "aws_route_table_association" "private_application" {
	count = var.availability_zone_count

	subnet_id      = aws_subnet.private_application[count.index].id
	route_table_id = aws_route_table.private_application[count.index].id
}

resource "aws_route_table" "private_database" {
	count = var.availability_zone_count

	vpc_id = aws_vpc.main.id

	tags = {
		Name = "${var.project_name}-private-db-rt-${count.index + 1}"
	}
}

resource "aws_route_table_association" "private_database" {
	count = var.availability_zone_count

	subnet_id      = aws_subnet.private_database[count.index].id
	route_table_id = aws_route_table.private_database[count.index].id
}

resource "aws_db_subnet_group" "main" {
	# Supply RDS with subnets across both selected AZs.
	name       = "${var.project_name}-db-subnet-group"
	subnet_ids = aws_subnet.private_database[*].id

	tags = {
		Name = "${var.project_name}-db-subnet-group"
	}
}
