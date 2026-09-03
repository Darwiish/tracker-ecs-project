# Expose the ALB ARN.
output "arn" {
  description = "Application load balancer ARN."
  value       = aws_lb.main.arn
}

# Expose the ALB DNS name.
output "dns_name" {
  description = "Application load balancer DNS name."
  value       = aws_lb.main.dns_name
}

# Expose the HTTPS listener ARN.
output "listener_arn" {
  description = "HTTPS listener ARN."
  value       = aws_lb_listener.https.arn
}

# Expose the backend target group ARN.
output "backend_target_group_arn" {
  description = "Backend application target group ARN."
  value       = aws_lb_target_group.backend.arn
}

# Expose the frontend target group ARN.
output "frontend_target_group_arn" {
  description = "Frontend application target group ARN."
  value       = aws_lb_target_group.frontend.arn
}