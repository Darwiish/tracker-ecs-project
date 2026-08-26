# Terraform Bootstrap

This root creates only the S3 bucket used by Terraform remote state. The
application infrastructure in `../terraform` uses a separate state key.

The backend block is intentionally present before the bucket exists. Initialize
with `-backend=false` for the first local run, then migrate the local bootstrap
state to S3 after the bucket has been created.

## Initial creation

From this directory:

```sh
terraform init -backend=false
terraform plan
terraform apply
```

Use `-var='state_bucket_name=...'` when a specific globally unique bucket name
is required. Otherwise the name is derived from the AWS account ID and region.

## Migrate bootstrap state to S3

Get the bucket name from `terraform output -raw state_bucket_name`, then run
the following command with the actual bucket and region values:

```sh
terraform init -migrate-state \
  -backend-config="bucket=tracker-terraform-state-ACCOUNT_ID-eu-north-1" \
  -backend-config="region=eu-north-1"
```

Replace the bucket placeholder with the value of
`terraform output -raw state_bucket_name`.
The migrated state key is `bootstrap/terraform.tfstate` and S3 lockfiles are
enabled with `use_lockfile = true`.

The main infrastructure must be configured separately with the same bucket and
the key `tracker/terraform.tfstate`.