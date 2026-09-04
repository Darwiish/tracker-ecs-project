# Expose ACM validation record FQDNs.
output "acm_validation_records" {
  description = "ACM validation record FQDNs."
  value       = [for record in cloudflare_dns_record.acm_validation : record.name]
}
