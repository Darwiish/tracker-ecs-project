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

# Trust GitHub Actions through its OIDC identity provider.
resource "aws_iam_openid_connect_provider" "github" {
  url = "https://token.actions.githubusercontent.com"

  client_id_list = [
    "sts.amazonaws.com",
  ]
}

# Allow the application repository to assume the deployment role.
data "aws_iam_policy_document" "github_actions_assume" {
  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [aws_iam_openid_connect_provider.github.arn]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:sub"
      values = [
        "repo:Darwiish@14542291/tracker-ecs-project@1312399984:ref:refs/heads/main"
      ]
    }
  }
}

# Create the role assumed by GitHub Actions.
resource "aws_iam_role" "github_actions" {
  name               = "github-actions-ecs-deploy"
  assume_role_policy = data.aws_iam_policy_document.github_actions_assume.json
}

# Allow GitHub Actions to authenticate and push application images to ECR.
resource "aws_iam_role_policy" "github_actions_ecr" {
  name = "${var.project_name}-github-actions-ecr"
  role = aws_iam_role.github_actions.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ecr:GetAuthorizationToken"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
           "ecr:BatchCheckLayerAvailability",
           "ecr:BatchGetImage",
           "ecr:CompleteLayerUpload",
           "ecr:InitiateLayerUpload",
           "ecr:PutImage",
           "ecr:UploadLayerPart"
        ]
        Resource = values(var.ecr_repository_arns)
      }
    ]
  })
}

# Allow GitHub Actions to manage the Terraform state in S3.
resource "aws_iam_role_policy" "github_actions_terraform_state" {
  name = "${var.project_name}-github-actions-terraform-state"
  role = aws_iam_role.github_actions.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:ListBucket"
        ]
        Resource = var.terraform_state_bucket_arn
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject"
        ]
        Resource = "${var.terraform_state_bucket_arn}/tracker/*"
      }
    ]
  })
}

# Allow Terraform to manage the AWS infrastructure.
resource "aws_iam_role_policy_attachment" "github_actions_admin" {
  role       = aws_iam_role.github_actions.name
  policy_arn = "arn:aws:iam::aws:policy/AdministratorAccess"
}