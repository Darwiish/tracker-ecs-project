# Expose private ECR repository ARNs by service.
output "repository_arns" {
  description = "Private ECR repository ARNs keyed by service."
  value       = { for service, repository in aws_ecr_repository.application : service => repository.arn }
}

# Expose private ECR repository URLs by service.
output "repository_urls" {
  description = "Private ECR repository URLs keyed by service."
  value       = { for service, repository in aws_ecr_repository.application : service => repository.repository_url }
}