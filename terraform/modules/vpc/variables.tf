# Identify the owning application in resource names and tags.
variable "project_name" {
  description = "Name prefix applied to VPC networking resources."
  type        = string
}

# Define the VPC address space.
variable "vpc_cidr" {
  description = "CIDR block for the VPC."
  type        = string
}

# Control the number of subnet and route-table replicas.
variable "availability_zone_count" {
  description = "Number of Availability Zones to use."
  type        = number
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets."
  type        = list(string)
}

variable "private_application_subnet_cidrs" {
  description = "CIDR blocks for private application subnets."
  type        = list(string)
}

variable "private_database_subnet_cidrs" {
  description = "CIDR blocks for private database subnets."
  type        = list(string)
}
