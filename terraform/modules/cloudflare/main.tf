# Create DNS records required for ACM validation.
resource "cloudflare_dns_record" "acm_validation" {
  for_each = {
    for option in var.acm_domain_validation_options :
    option.domain_name => option
  }

  zone_id = var.zone_id
  name    = each.value.resource_record_name
  type    = each.value.resource_record_type
  content = each.value.resource_record_value
  ttl     = 60
  proxied = false
}