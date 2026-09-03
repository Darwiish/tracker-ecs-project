# Project name used in ACM resource names.
variable "project_name" {
  description = "Project name used for ACM resources."
  type        = string
}

# Production domain covered by the ACM certificate.
variable "domain_name" {
  description = "Production domain covered by the ACM certificate."
  type        = string
}