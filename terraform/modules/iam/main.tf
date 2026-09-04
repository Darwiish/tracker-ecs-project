# Define the trust policy for ECS task roles.
data "aws_iam_policy_document" "assume_ecs" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["ecs-tasks.amazonaws.com"]
    }
  }
}

# Create the IAM role used by ECS task execution.
resource "aws_iam_role" "task_execution" {
  name               = "${var.project_name}-ecs-task-execution"
  assume_role_policy = data.aws_iam_policy_document.assume_ecs.json
}

# Create the IAM role used by application containers.
resource "aws_iam_role" "task" {
  name               = "${var.project_name}-ecs-task"
  assume_role_policy = data.aws_iam_policy_document.assume_ecs.json
}

# Allow ECS Exec to establish Systems Manager control and data channels.
resource "aws_iam_role_policy" "task_exec" {
  name = "${var.project_name}-ecs-task-exec"
  role = aws_iam_role.task.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ssmmessages:CreateControlChannel",
          "ssmmessages:CreateDataChannel",
          "ssmmessages:OpenControlChannel",
          "ssmmessages:OpenDataChannel"
        ]
        Resource = "*"
      }
    ]
  })
}

# Define permissions required to run ECS tasks.
data "aws_iam_policy_document" "execution_permissions" {
  statement {
    actions   = ["ecr:GetAuthorizationToken"]
    resources = ["*"]
  }

  statement {
    actions = [
      "ecr:BatchCheckLayerAvailability",
      "ecr:BatchGetImage",
      "ecr:GetDownloadUrlForLayer",
    ]
    resources = values(var.ecr_repository_arns)
  }

  statement {
    actions   = ["logs:CreateLogStream", "logs:PutLogEvents"]
    resources = [for arn in values(var.log_group_arns) : "${arn}:*"]
  }

  statement {
    actions   = ["secretsmanager:GetSecretValue"]
    resources = var.secret_arns
  }
}

# Attach execution permissions to the ECS task execution role.
resource "aws_iam_role_policy" "task_execution" {
  name   = "${var.project_name}-ecs-task-execution"
  role   = aws_iam_role.task_execution.id
  policy = data.aws_iam_policy_document.execution_permissions.json
}