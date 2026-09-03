# Expose the ACM certificate ARN.
output "certificate_arn" {
  description = "ACM certificate ARN."
  value       = aws_acm_certificate.main.arn
}

# Expose the DNS validation records.
output "domain_validation_options" {
  description = "ACM DNS validation records."
  value       = aws_acm_certificate.main.domain_validation_options
}