# Expose the production hostname.
output "application_hostname" {
  description = "Production application hostname."
  value       = cloudflare_dns_record.application.name
}