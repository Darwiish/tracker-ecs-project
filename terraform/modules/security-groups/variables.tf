variable "project_name" {
	description = "Name prefix for security groups."
	type        = string
}

variable "vpc_id" {
	description = "ID of the VPC containing the security groups."
	type        = string
}

variable "vpc_cidr" {
	description = "CIDR used for endpoint security group egress."
	type        = string
}
