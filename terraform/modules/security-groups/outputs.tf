output "alb_security_group_id" {
  description = "ID of the ALB security group."
  value       = aws_security_group.alb.id
}

output "frontend_security_group_id" {
  description = "ID of the frontend ECS security group."
  value       = aws_security_group.frontend.id
}

output "backend_security_group_id" {
  description = "ID of the backend ECS security group."
  value       = aws_security_group.backend.id
}

output "rds_security_group_id" {
  description = "ID of the RDS security group."
  value       = aws_security_group.rds.id
}

output "vpc_endpoint_security_group_id" {
  description = "ID of the VPC endpoint security group."
  value       = aws_security_group.vpc_endpoint.id
}
