output "endpoint_ids" {
	description = "IDs of the created VPC endpoints keyed by service."
	value = merge(
		{ for service, endpoint in aws_vpc_endpoint.interface : service => endpoint.id },
		{ s3 = aws_vpc_endpoint.s3.id }
	)
}