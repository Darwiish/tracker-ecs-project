module "vpc" {
  # Provide the core network consumed by dependent resources.
  source = "./modules/vpc"

  project_name                     = var.project_name
  vpc_cidr                         = var.vpc_cidr
  availability_zone_count          = var.availability_zone_count
  public_subnet_cidrs              = var.public_subnet_cidrs
  private_application_subnet_cidrs = var.private_application_subnet_cidrs
  private_database_subnet_cidrs    = var.private_database_subnet_cidrs
}

module "security_groups" {
  source = "./modules/security-groups"

  project_name = var.project_name
  vpc_id       = module.vpc.vpc_id
  vpc_cidr     = var.vpc_cidr
}

module "vpc_endpoints" {
  source = "./modules/vpc-endpoints"

  project_name                        = var.project_name
  aws_region                          = var.aws_region
  vpc_id                              = module.vpc.vpc_id
  private_application_subnet_ids      = module.vpc.private_application_subnet_ids
  private_application_route_table_ids = module.vpc.private_application_route_table_ids
  endpoint_security_group_id          = module.security_groups.vpc_endpoint_security_group_id
}
