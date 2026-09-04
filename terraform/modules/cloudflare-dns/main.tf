# Point the production hostname to the ALB.
resource "cloudflare_dns_record" "application" {
  zone_id = var.zone_id
  name    = var.record_name
  type    = "CNAME"
  content = var.alb_dns_name
  ttl     = 1
  proxied = true
}
