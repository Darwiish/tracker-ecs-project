output "vpc_id" {
  description = "ID of the tracker VPC."
  value       = module.vpc.vpc_id
}

output "availability_zones" {
  description = "Availability Zones selected for the tracker network."
  value       = module.vpc.availability_zones
}

output "public_subnet_ids" {
  description = "IDs of the public subnets."
  value       = module.vpc.public_subnet_ids
}

output "private_application_subnet_ids" {
  description = "IDs of the private application subnets."
  value       = module.vpc.private_application_subnet_ids
}

output "private_database_subnet_ids" {
  description = "IDs of the private database subnets."
  value       = module.vpc.private_database_subnet_ids
}

output "public_route_table_id" {
  description = "ID of the public route table."
  value       = module.vpc.public_route_table_id
}

output "private_application_route_table_ids" {
  description = "IDs of the private application route tables."
  value       = module.vpc.private_application_route_table_ids
}

output "private_database_route_table_ids" {
  description = "IDs of the private database route tables."
  value       = module.vpc.private_database_route_table_ids
}

output "db_subnet_group_name" {
  description = "Name of the RDS DB subnet group."
  value       = module.vpc.db_subnet_group_name
}

output "db_subnet_group_id" {
  description = "ID of the RDS DB subnet group."
  value       = module.vpc.db_subnet_group_id
}

output "alb_security_group_id" {
  description = "ID of the ALB security group."
  value       = module.security_groups.alb_security_group_id
}

output "frontend_security_group_id" {
  description = "ID of the frontend ECS security group."
  value       = module.security_groups.frontend_security_group_id
}

output "backend_security_group_id" {
  description = "ID of the backend ECS security group."
  value       = module.security_groups.backend_security_group_id
}

output "rds_security_group_id" {
  description = "ID of the RDS security group."
  value       = module.security_groups.rds_security_group_id
}

output "vpc_endpoint_security_group_id" {
  description = "ID of the VPC endpoint security group."
  value       = module.security_groups.vpc_endpoint_security_group_id
}

output "vpc_endpoint_ids" {
  description = "IDs of the interface and gateway VPC endpoints."
  value       = module.vpc_endpoints.endpoint_ids
}