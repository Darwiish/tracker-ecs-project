# Expose the JWT signing secret ARN.
output "jwt_secret_arn" {
  description = "ARN of the JWT signing secret."
  value       = aws_secretsmanager_secret.jwt.arn
}