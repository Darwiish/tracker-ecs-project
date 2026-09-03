# Project name used as the database instance name prefix.
variable "project_name" {
  description = "Name prefix for the database instance."
  type        = string
}

# Existing private subnet group for the RDS instance.
variable "db_subnet_group_name" {
  description = "Existing private RDS DB subnet group name."
  type        = string
}

# Security group attached to the RDS instance.
variable "rds_security_group_id" {
  description = "Existing RDS security group ID."
  type        = string
}

# Initial PostgreSQL database name.
variable "database_name" {
  description = "Initial database name."
  type        = string
}

# Master username for the RDS database.
variable "database_username" {
  description = "RDS master username."
  type        = string
}

# RDS instance size and capacity class.
variable "database_instance_class" {
  description = "RDS instance class."
  type        = string
}

# Storage capacity allocated to the database.
variable "allocated_storage" {
  description = "Allocated storage in GiB."
  type        = number
}

# Number of days to retain automated backups.
variable "backup_retention_period" {
  description = "Automated backup retention in days."
  type        = number
}

# Prevent accidental deletion of the database.
variable "deletion_protection" {
  description = "Whether deletion protection is enabled."
  type        = bool
}