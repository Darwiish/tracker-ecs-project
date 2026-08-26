locals {
	interface_services = toset([
		"ecr.api",
		"ecr.dkr",
		"logs",
		"secretsmanager",
	])
}

resource "aws_vpc_endpoint" "interface" {
	for_each = local.interface_services

	vpc_id              = var.vpc_id
	service_name        = "com.amazonaws.${var.aws_region}.${each.value}"
	vpc_endpoint_type   = "Interface"
	private_dns_enabled = true
	subnet_ids          = var.private_application_subnet_ids
	security_group_ids  = [var.endpoint_security_group_id]

	tags = {
		Name = "${var.project_name}-${replace(each.value, ".", "-")}-endpoint"
	}
}

resource "aws_vpc_endpoint" "s3" {
	vpc_id            = var.vpc_id
	service_name      = "com.amazonaws.${var.aws_region}.s3"
	vpc_endpoint_type = "Gateway"
	route_table_ids   = var.private_application_route_table_ids

	tags = {
		Name = "${var.project_name}-s3-endpoint"
	}
}