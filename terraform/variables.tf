# Use Stockholm unless another region is explicitly provided.
variable "aws_region" {
  description = "AWS region for the tracker infrastructure."
  type        = string
  default     = "eu-north-1"
}

# Prefix networking resources with the project name.
variable "project_name" {
  description = "Name prefix applied to VPC networking resources."
  type        = string
  default     = "tracker"
}

# Select this many dynamically discovered Availability Zones.
variable "availability_zone_count" {
  description = "Number of Availability Zones to use for the network."
  type        = number
  default     = 2

  validation {
    condition     = var.availability_zone_count >= 2
    error_message = "availability_zone_count must be at least 2."
  }
}

variable "vpc_cidr" {
  description = "CIDR block for the tracker VPC."
  type        = string
  default     = "10.0.0.0/16"
}

# Keep public subnet CIDRs separate from private tiers.
variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets, one per selected AZ."
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_application_subnet_cidrs" {
  description = "CIDR blocks for private application subnets, one per selected AZ."
  type        = list(string)
  default     = ["10.0.11.0/24", "10.0.12.0/24"]
}

variable "private_database_subnet_cidrs" {
  description = "CIDR blocks for private database subnets, one per selected AZ."
  type        = list(string)
  default     = ["10.0.21.0/24", "10.0.22.0/24"]
}
