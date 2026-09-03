# Generate a strong random secret for JWT signing.
resource "random_password" "jwt" {
  length  = 64
  special = true
}

# Store the JWT signing secret in Secrets Manager.
resource "aws_secretsmanager_secret" "jwt" {
  name                           = "${var.project_name}/jwt-secret"
  description                    = "JWT signing secret for the tracker backend."
  force_overwrite_replica_secret = false
}

# Store the generated JWT secret value.
resource "aws_secretsmanager_secret_version" "jwt" {
  secret_id     = aws_secretsmanager_secret.jwt.id
  secret_string = random_password.jwt.result
}