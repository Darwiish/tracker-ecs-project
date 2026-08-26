resource "aws_security_group" "alb" {
	name                   = "${var.project_name}-alb"
	description            = "Security group for the public load balancer."
	vpc_id                 = var.vpc_id
	revoke_rules_on_delete = true
}

resource "aws_security_group" "frontend" {
	name                   = "${var.project_name}-frontend"
	description            = "Security group for private frontend tasks."
	vpc_id                 = var.vpc_id
	revoke_rules_on_delete = true
}

resource "aws_security_group" "backend" {
	name                   = "${var.project_name}-backend"
	description            = "Security group for private backend tasks."
	vpc_id                 = var.vpc_id
	revoke_rules_on_delete = true
}

resource "aws_security_group" "rds" {
	name                   = "${var.project_name}-rds"
	description            = "Security group for private PostgreSQL."
	vpc_id                 = var.vpc_id
	revoke_rules_on_delete = true
}

resource "aws_security_group" "vpc_endpoint" {
	name                   = "${var.project_name}-vpc-endpoint"
	description            = "Security group for private interface endpoints."
	vpc_id                 = var.vpc_id
	revoke_rules_on_delete = true
}

resource "aws_vpc_security_group_ingress_rule" "alb_http" {
	security_group_id = aws_security_group.alb.id
	description       = "Public HTTP"
	ip_protocol       = "tcp"
	from_port         = 80
	to_port           = 80
	cidr_ipv4         = "0.0.0.0/0"
}

resource "aws_vpc_security_group_ingress_rule" "alb_https" {
	security_group_id = aws_security_group.alb.id
	description       = "Public HTTPS"
	ip_protocol       = "tcp"
	from_port         = 443
	to_port           = 443
	cidr_ipv4         = "0.0.0.0/0"
}

resource "aws_vpc_security_group_egress_rule" "alb_all" {
	security_group_id = aws_security_group.alb.id
	description       = "Allow forwarding and health checks"
	ip_protocol       = "-1"
	cidr_ipv4         = "0.0.0.0/0"
}

resource "aws_vpc_security_group_ingress_rule" "frontend_http" {
	security_group_id            = aws_security_group.frontend.id
	description                  = "HTTP from the load balancer"
	ip_protocol                  = "tcp"
	from_port                    = 80
	to_port                      = 80
	referenced_security_group_id = aws_security_group.alb.id
}

resource "aws_vpc_security_group_egress_rule" "frontend_https" {
	security_group_id            = aws_security_group.frontend.id
	description                  = "HTTPS to private AWS service endpoints"
	ip_protocol                  = "tcp"
	from_port                    = 443
	to_port                      = 443
	referenced_security_group_id = aws_security_group.vpc_endpoint.id
}

resource "aws_vpc_security_group_ingress_rule" "backend_api" {
	security_group_id            = aws_security_group.backend.id
	description                  = "API traffic from the load balancer"
	ip_protocol                  = "tcp"
	from_port                    = 5000
	to_port                      = 5000
	referenced_security_group_id = aws_security_group.alb.id
}

resource "aws_vpc_security_group_egress_rule" "backend_postgres" {
	security_group_id            = aws_security_group.backend.id
	description                  = "PostgreSQL traffic to the database"
	ip_protocol                  = "tcp"
	from_port                    = 5432
	to_port                      = 5432
	referenced_security_group_id = aws_security_group.rds.id
}

resource "aws_vpc_security_group_egress_rule" "backend_https" {
	security_group_id            = aws_security_group.backend.id
	description                  = "HTTPS to private AWS service endpoints"
	ip_protocol                  = "tcp"
	from_port                    = 443
	to_port                      = 443
	referenced_security_group_id = aws_security_group.vpc_endpoint.id
}

resource "aws_vpc_security_group_ingress_rule" "rds_postgres" {
	security_group_id            = aws_security_group.rds.id
	description                  = "PostgreSQL from the backend"
	ip_protocol                  = "tcp"
	from_port                    = 5432
	to_port                      = 5432
	referenced_security_group_id = aws_security_group.backend.id
}

resource "aws_vpc_security_group_ingress_rule" "endpoint_frontend_https" {
	security_group_id            = aws_security_group.vpc_endpoint.id
	description                  = "HTTPS from frontend tasks"
	ip_protocol                  = "tcp"
	from_port                    = 443
	to_port                      = 443
	referenced_security_group_id = aws_security_group.frontend.id
}

resource "aws_vpc_security_group_ingress_rule" "endpoint_backend_https" {
	security_group_id            = aws_security_group.vpc_endpoint.id
	description                  = "HTTPS from backend tasks"
	ip_protocol                  = "tcp"
	from_port                    = 443
	to_port                      = 443
	referenced_security_group_id = aws_security_group.backend.id
}

resource "aws_vpc_security_group_egress_rule" "endpoint_vpc" {
	security_group_id = aws_security_group.vpc_endpoint.id
	description       = "Return traffic within the VPC"
	ip_protocol       = "-1"
	cidr_ipv4         = var.vpc_cidr
}
