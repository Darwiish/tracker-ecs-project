# Cloudflare zone ID for the production domain.
variable "zone_id" {
  description = "Cloudflare zone ID for the production domain."
  type        = string
}

# Production hostname used for the application.
variable "record_name" {
  description = "Production DNS record name."
  type        = string
}

# ACM DNS validation records.
variable "acm_domain_validation_options" {
  description = "ACM DNS validation records."

  type = list(object({
    domain_name           = string
    resource_record_name  = string
    resource_record_type  = string
    resource_record_value = string
  }))
}