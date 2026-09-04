# Return the network identifier to the root module.
output "vpc_id" {
  description = "ID of the VPC."
  value       = aws_vpc.main.id
}

# Return the dynamically selected AZs.
output "availability_zones" {
  description = "Selected Availability Zones."
  value       = local.availability_zones
}

output "public_subnet_ids" {
  description = "IDs of the public subnets."
  value       = aws_subnet.public[*].id
}

output "private_application_subnet_ids" {
  description = "IDs of the private application subnets."
  value       = aws_subnet.private_application[*].id
}

output "private_database_subnet_ids" {
  description = "IDs of the private database subnets."
  value       = aws_subnet.private_database[*].id
}

output "public_route_table_id" {
  description = "ID of the public route table."
  value       = aws_route_table.public.id
}

output "private_application_route_table_ids" {
  description = "IDs of the private application route tables."
  value       = aws_route_table.private_application[*].id
}

output "private_database_route_table_ids" {
  description = "IDs of the private database route tables."
  value       = aws_route_table.private_database[*].id
}

output "db_subnet_group_name" {
  description = "Name of the RDS DB subnet group."
  value       = aws_db_subnet_group.main.name
}

output "db_subnet_group_id" {
  description = "ID of the RDS DB subnet group."
  value       = aws_db_subnet_group.main.id
}
