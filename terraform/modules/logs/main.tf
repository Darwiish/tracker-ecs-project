# Create a dedicated CloudWatch log group for each ECS service.
resource "aws_cloudwatch_log_group" "application" {
  for_each = toset(["frontend", "backend"])

  name              = "/ecs/${var.project_name}-${each.value}"
  retention_in_days = var.retention_in_days
}