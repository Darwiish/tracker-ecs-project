# Expose application log group ARNs by service.
output "log_group_arns" {
  description = "Application CloudWatch log group ARNs keyed by service."
  value       = { for service, group in aws_cloudwatch_log_group.application : service => group.arn }
}

# Expose application log group names by service.
output "log_group_names" {
  description = "Application CloudWatch log group names keyed by service."
  value       = { for service, group in aws_cloudwatch_log_group.application : service => group.name }
}