# Project name used as the log group name prefix.
variable "project_name" {
  description = "Name prefix for application log groups."
  type        = string
}

# Number of days to retain application logs.
variable "retention_in_days" {
  description = "CloudWatch log retention period."
  type        = number
}