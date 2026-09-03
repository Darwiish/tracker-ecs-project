# Create the private PostgreSQL RDS instance.
resource "aws_db_instance" "postgres" {
  identifier                  = "${var.project_name}-postgres"
  engine                      = "postgres"
  engine_version              = "16.9"
  instance_class              = var.database_instance_class
  allocated_storage           = var.allocated_storage
  storage_type                = "gp3"
  db_name                     = var.database_name
  username                    = var.database_username
  manage_master_user_password = true
  port                        = 5432
  db_subnet_group_name        = var.db_subnet_group_name
  vpc_security_group_ids      = [var.rds_security_group_id]
  publicly_accessible         = false
  storage_encrypted           = true
  backup_retention_period     = var.backup_retention_period
  deletion_protection         = var.deletion_protection
  copy_tags_to_snapshot       = true
  skip_final_snapshot         = false
  final_snapshot_identifier   = "${var.project_name}-postgres-final"

  tags = {
    Name = "${var.project_name}-postgres"
  }
}
