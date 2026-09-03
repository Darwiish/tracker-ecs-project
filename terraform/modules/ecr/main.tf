# Define the application container repositories.
locals {
  repositories = toset(["frontend", "backend"])
}

# Create an ECR repository for each application service.
resource "aws_ecr_repository" "application" {
  for_each = local.repositories

  name                 = "${var.project_name}-${each.value}"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = {
    Name = "${var.project_name}-${each.value}"
  }
}

# Remove older images to limit ECR storage usage.
resource "aws_ecr_lifecycle_policy" "application" {
  for_each = aws_ecr_repository.application

  repository = each.value.name
  policy = jsonencode({
    rules = [{
      rulePriority = 1
      description  = "Retain the five most recent images"
      selection = {
        tagStatus   = "any"
        countType   = "imageCountMoreThan"
        countNumber = 5
      }
      action = { type = "expire" }
    }]
  })
}