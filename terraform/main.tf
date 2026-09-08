# Create CloudWatch log groups used by ECS containers.
module "logs" {
  source = "./modules/logs"

  project_name      = var.project_name
  retention_in_days = 30
}

# Create the core VPC and subnet tiers.
module "vpc" {
  source = "./modules/vpc"

  project_name                     = var.project_name
  vpc_cidr                         = var.vpc_cidr
  availability_zone_count          = var.availability_zone_count
  public_subnet_cidrs              = var.public_subnet_cidrs
  private_application_subnet_cidrs = var.private_application_subnet_cidrs
  private_database_subnet_cidrs    = var.private_database_subnet_cidrs
}

# Create security groups for the application tiers.
module "security_groups" {
  source = "./modules/security-groups"

  project_name = var.project_name
  vpc_id       = module.vpc.vpc_id
  vpc_cidr     = var.vpc_cidr
}

# Create private VPC endpoints for AWS service access.
module "vpc_endpoints" {
  source = "./modules/vpc-endpoints"

  project_name                        = var.project_name
  aws_region                          = var.aws_region
  vpc_id                              = module.vpc.vpc_id
  private_application_subnet_ids      = module.vpc.private_application_subnet_ids
  private_application_route_table_ids = module.vpc.private_application_route_table_ids
  endpoint_security_group_id          = module.security_groups.vpc_endpoint_security_group_id
}

# Request the ACM certificate for the production domain.
module "acm" {
  source = "./modules/acm"

  project_name = var.project_name
  domain_name  = var.domain_name
}

# Create DNS records required for ACM validation.
module "cloudflare_validation" {
  source = "./modules/cloudflare"

  zone_id                       = var.cloudflare_zone_id
  record_name                   = var.domain_name
  acm_domain_validation_options = module.acm.domain_validation_options
}

resource "aws_acm_certificate_validation" "main" {
  certificate_arn = module.acm.certificate_arn

  validation_record_fqdns = module.cloudflare_validation.acm_validation_records
}

# Create private ECR repositories for application images.
module "ecr" {
  source = "./modules/ecr"

  project_name = var.project_name
}

# Create application secrets in Secrets Manager.
module "secrets" {
  source = "./modules/secrets"

  project_name = var.project_name
}

# Create the private PostgreSQL RDS instance.
module "rds" {
  source = "./modules/rds"

  project_name            = var.project_name
  db_subnet_group_name    = module.vpc.db_subnet_group_name
  rds_security_group_id   = module.security_groups.rds_security_group_id
  database_name           = var.database_name
  database_username       = var.database_username
  database_instance_class = var.database_instance_class
  allocated_storage       = var.allocated_storage
  backup_retention_period = var.backup_retention_period
  deletion_protection     = var.deletion_protection
}

# Create IAM roles and permissions required by ECS tasks.
module "iam" {
  source = "./modules/iam"

  project_name               = var.project_name
  ecr_repository_arns        = module.ecr.repository_arns
  log_group_arns             = module.logs.log_group_arns
  terraform_state_bucket_arn = "arn:aws:s3:::tracker-terraform-state-224084343617-eu-north-1"

  secret_arns = [
    module.rds.master_user_secret_arn,
    module.secrets.jwt_secret_arn,
  ]
}

# Create the public ALB and HTTPS routing.
module "alb" {
  source = "./modules/alb"

  project_name          = var.project_name
  vpc_id                = module.vpc.vpc_id
  public_subnet_ids     = module.vpc.public_subnet_ids
  alb_security_group_id = module.security_groups.alb_security_group_id
  certificate_arn       = module.acm.certificate_arn

  depends_on = [aws_acm_certificate_validation.main]
}

# Point the production hostname to the ALB.
module "cloudflare_dns" {
  source = "./modules/cloudflare-dns"

  zone_id      = var.cloudflare_zone_id
  record_name  = var.domain_name
  alb_dns_name = module.alb.dns_name
}

# Create ECS services and connect them to the ALB.
module "ecs" {
  source = "./modules/ecs"

  cluster_name                   = var.cluster_name
  container_insights_enabled     = var.container_insights_enabled
  aws_region                     = var.aws_region
  backend_image_repository_url   = module.ecr.repository_urls["backend"]
  frontend_image_repository_url  = module.ecr.repository_urls["frontend"]
  backend_image_digest           = var.backend_image_digest
  frontend_image_digest          = var.frontend_image_digest
  task_execution_role_arn        = module.iam.task_execution_role_arn
  task_role_arn                  = module.iam.task_role_arn
  backend_log_group_name         = var.backend_log_group_name
  frontend_log_group_name        = var.frontend_log_group_name
  rds_endpoint                   = module.rds.endpoint
  database_name                  = var.database_name
  rds_master_user_secret_arn     = module.rds.master_user_secret_arn
  jwt_secret_arn                 = module.secrets.jwt_secret_arn
  private_application_subnet_ids = module.vpc.private_application_subnet_ids
  backend_security_group_id      = module.security_groups.backend_security_group_id
  frontend_security_group_id     = module.security_groups.frontend_security_group_id
  backend_target_group_arn       = module.alb.backend_target_group_arn
  frontend_target_group_arn      = module.alb.frontend_target_group_arn
  backend_desired_count          = var.backend_desired_count
  frontend_desired_count         = var.frontend_desired_count
}