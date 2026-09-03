# Expose the private PostgreSQL endpoint.
output "endpoint" {
  description = "Private PostgreSQL endpoint."
  value       = aws_db_instance.postgres.address
}

# Expose the ARN of the RDS-managed master credentials secret.
output "master_user_secret_arn" {
  description = "RDS-managed master credential secret ARN."
  value       = aws_db_instance.postgres.master_user_secret[0].secret_arn
}