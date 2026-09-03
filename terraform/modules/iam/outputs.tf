# Expose the ECS task execution role ARN.
output "task_execution_role_arn" {
  description = "ECS task execution role ARN."
  value       = aws_iam_role.task_execution.arn
}

# Expose the ECS task role ARN.
output "task_role_arn" {
  description = "ECS task role ARN."
  value       = aws_iam_role.task.arn
}