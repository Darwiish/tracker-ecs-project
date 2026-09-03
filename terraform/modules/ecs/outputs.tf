# Expose the ECS cluster ARN.
output "cluster_arn" {
  description = "ECS cluster ARN."
  value       = aws_ecs_cluster.main.arn
}

# Expose the ECS cluster name.
output "cluster_name" {
  description = "ECS cluster name."
  value       = aws_ecs_cluster.main.name
}

# Expose the backend ECS service name.
output "backend_service_name" {
  description = "Backend ECS service name."
  value       = aws_ecs_service.backend.name
}

# Expose the frontend ECS service name.
output "frontend_service_name" {
  description = "Frontend ECS service name."
  value       = aws_ecs_service.frontend.name
}

# Expose the backend task definition ARN.
output "backend_task_definition_arn" {
  description = "Backend ECS task definition ARN."
  value       = aws_ecs_task_definition.backend.arn
}

# Expose the frontend task definition ARN.
output "frontend_task_definition_arn" {
  description = "Frontend ECS task definition ARN."
  value       = aws_ecs_task_definition.frontend.arn
}