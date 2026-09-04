# Cloudflare zone ID for the production domain.
variable "zone_id" {
  description = "Cloudflare zone ID for the production domain."
  type        = string
}

# Production hostname.
variable "record_name" {
  description = "Production DNS record name."
  type        = string
}

# Existing ALB DNS name.
variable "alb_dns_name" {
  description = "Application load balancer DNS name."
  type        = string
}