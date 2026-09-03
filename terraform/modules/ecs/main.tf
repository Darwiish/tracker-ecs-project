# Create the ECS cluster and configure Container Insights.
resource "aws_ecs_cluster" "main" {
  name = var.cluster_name

  setting {
    name  = "containerInsights"
    value = var.container_insights_enabled ? "enabled" : "disabled"
  }
}

# Define consistent container names for the ECS services.
locals {
  backend_container_name  = "backend"
  frontend_container_name = "frontend"
}

# Define the backend Fargate task.
resource "aws_ecs_task_definition" "backend" {
  family                   = "${var.cluster_name}-backend"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = "256"
  memory                   = "512"
  execution_role_arn       = var.task_execution_role_arn
  task_role_arn            = var.task_role_arn

  container_definitions = jsonencode([
    {
      name      = local.backend_container_name
      image     = "${var.backend_image_repository_url}@${var.backend_image_digest}"
      essential = true
      portMappings = [{
        containerPort = 5000
        hostPort      = 5000
        protocol      = "tcp"
      }]
      environment = [
        { name = "DB_HOST", value = var.rds_endpoint },
        { name = "DB_PORT", value = "5432" },
        { name = "DB_NAME", value = var.database_name },
        { name = "PORT", value = "5000" },
      ]
      secrets = [
        { name = "DB_USER", valueFrom = "${var.rds_master_user_secret_arn}:username::" },
        { name = "DB_PASSWORD", valueFrom = "${var.rds_master_user_secret_arn}:password::" },
        { name = "JWT_SECRET", valueFrom = var.jwt_secret_arn },
      ]
      healthCheck = {
        command     = ["CMD-SHELL", "node -e 'require(\"http\").get(\"http://localhost:5000/api/health\", r => process.exit(r.statusCode === 200 ? 0 : 1)).on(\"error\", () => process.exit(1))'"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 20
      }
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = var.backend_log_group_name
          awslogs-region        = var.aws_region
          awslogs-stream-prefix = "ecs"
        }
      }
    },
  ])
}

# Define the frontend Fargate task.
resource "aws_ecs_task_definition" "frontend" {
  family                   = "${var.cluster_name}-frontend"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = "256"
  memory                   = "512"
  execution_role_arn       = var.task_execution_role_arn
  task_role_arn            = var.task_role_arn

  container_definitions = jsonencode([
    {
      name      = local.frontend_container_name
      image     = "${var.frontend_image_repository_url}@${var.frontend_image_digest}"
      essential = true
      portMappings = [{
        containerPort = 80
        hostPort      = 80
        protocol      = "tcp"
      }]
      healthCheck = {
        command     = ["CMD-SHELL", "wget -q -O /dev/null http://localhost/ || exit 1"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 10
      }
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = var.frontend_log_group_name
          awslogs-region        = var.aws_region
          awslogs-stream-prefix = "ecs"
        }
      }
    },
  ])
}

# Run the backend tasks in private application subnets.
resource "aws_ecs_service" "backend" {
  name            = "${var.cluster_name}-backend"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.backend.arn
  desired_count   = var.backend_desired_count
  launch_type     = "FARGATE"

  load_balancer {
    target_group_arn = var.backend_target_group_arn
    container_name   = local.backend_container_name
    container_port   = 5000
  }

  network_configuration {
    subnets          = var.private_application_subnet_ids
    security_groups  = [var.backend_security_group_id]
    assign_public_ip = false
  }
}

# Run the frontend tasks in private application subnets.
resource "aws_ecs_service" "frontend" {
  name            = "${var.cluster_name}-frontend"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.frontend.arn
  desired_count   = var.frontend_desired_count
  launch_type     = "FARGATE"

  load_balancer {
    target_group_arn = var.frontend_target_group_arn
    container_name   = local.frontend_container_name
    container_port   = 80
  }

  network_configuration {
    subnets          = var.private_application_subnet_ids
    security_groups  = [var.frontend_security_group_id]
    assign_public_ip = false
  }
}