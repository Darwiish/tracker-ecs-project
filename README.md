# tracker-ecs-project

A full-stack task and project tracker built as a DevOps capstone project.

The application provides a practical workload for demonstrating containerization, AWS networking, ECS Fargate, PostgreSQL, Application Load Balancing, Infrastructure as Code with Terraform, CI/CD with GitHub Actions, security scanning, secrets management, and immutable container deployments.

The AWS environment was successfully deployed and tested, then intentionally destroyed to avoid ongoing AWS costs. This repository therefore documents and contains the configuration for the deployment; it does not mean that the AWS environment is currently running.

## What is this application?

The project is a task and project management application with a React frontend, Node.js backend API, and PostgreSQL database.

The application supports:

- User authentication
- JWT-based stateless authentication
- Password hashing
- Task creation, editing, and deletion
- Task priorities
- Categories
- Task descriptions
- Task status management
- Kanban board
- List/table views
- Search and filtering
- Pagination
- Statistics and progress information
- Dark mode
- Due dates and overdue task handling

The application itself is intentionally straightforward. The main purpose of the project is to demonstrate how a full-stack application can be containerized, deployed, secured, monitored, and managed using modern DevOps practices.

## Tech stack

| Area                   | Technology                |
| ---------------------- | ------------------------- |
| Frontend               | React / TypeScript        |
| Backend                | Node.js API               |
| Database               | PostgreSQL                |
| Containerization       | Docker / Docker Compose   |
| Container registry     | Amazon ECR                |
| Container platform     | Amazon ECS Fargate        |
| Load balancing         | Application Load Balancer |
| Database hosting       | Amazon RDS for PostgreSQL |
| Infrastructure as Code | Terraform                 |
| CI/CD                  | GitHub Actions            |
| AWS authentication     | GitHub OIDC               |
| Secrets                | AWS Secrets Manager       |
| DNS / Edge             | Cloudflare                |
| TLS                    | ACM / Cloudflare          |
| Security scanning      | TFLint / tfsec            |

## Architecture

The deployed AWS architecture follows a public-edge/private-application design:

```text
                         Internet
                            |
                            v
                        Cloudflare
                            |
                          HTTPS
                            |
                            v
                Application Load Balancer
                    Public Subnets
                            |
              +-------------+-------------+
              |                           |
          /* traffic                  /api/* traffic
              |                           |
              v                           v
     Frontend ECS Service         Backend ECS Service
          Fargate                      Fargate
     Private App Subnets          Private App Subnets
                                          |
                                          |
                                          v
                                  RDS PostgreSQL
                                  Private DB Subnets


        VPC Endpoints
              |
              +---- ECR
              +---- S3
              +---- Secrets Manager
              +---- CloudWatch Logs
```

The important networking boundary is:

- The ALB is internet-facing and runs in public subnets.
- Frontend ECS tasks run in private application subnets.
- Backend ECS tasks run in private application subnets.
- RDS PostgreSQL runs in private database subnets.
- ECS tasks do not receive public IP addresses.
- Security groups restrict traffic between the ALB, ECS services, and database.
- VPC endpoints provide private access to required AWS services.
- No NAT Gateway is required for the application's AWS service access pattern.

The deployed VPC uses multiple Availability Zones for the public, application, and database subnet layers.

## Request routing

The ALB provides the public entry point for the application.

Traffic is routed according to the configured path rules:

```text
https://<domain>/api/*  -> Backend ECS service
https://<domain>/*      -> Frontend ECS service
```

This keeps the backend private while allowing the frontend and API to share the same public application entry point.

Cloudflare is used for DNS and edge/TLS configuration, while the AWS ALB handles application traffic into the VPC.

## AWS infrastructure

### VPC

The Terraform configuration creates a dedicated VPC with separate subnet layers:

```text
VPC
|
+-- Public subnets
|     |
|     +-- Application Load Balancer
|
+-- Private application subnets
|     |
|     +-- Frontend ECS
|     +-- Backend ECS
|
+-- Private database subnets
      |
      +-- RDS PostgreSQL
```

The private application and database route tables do not require a default internet route.

### ECS Fargate

The application runs on Amazon ECS using Fargate.

The deployment contains separate services for:

- Frontend
- Backend

The ECS tasks:

- Run in private application subnets
- Do not use public IP addresses
- Pull container images from ECR
- Send container logs to CloudWatch Logs
- Use security groups to control network access
- Receive application configuration through environment variables and secrets

### Application Load Balancer

The ALB is the public entry point into the VPC.

The Terraform configuration provides:

- Internet-facing ALB
- HTTPS listener
- HTTP-to-HTTPS redirection where configured
- Frontend target group
- Backend target group
- Path-based routing
- Security-group controlled access to ECS tasks

### RDS PostgreSQL

PostgreSQL is hosted using Amazon RDS.

The database:

- Runs in private database subnets
- Is not publicly accessible
- Uses a dedicated DB subnet group
- Uses security-group controlled access
- Uses encrypted storage
- Uses AWS-managed password handling where configured
- Is separated from the ECS application tier through the VPC network design

The application connects to PostgreSQL over the private VPC network.

### ECR

Amazon ECR stores the frontend and backend container images.

Separate repositories are used for the two application components:

```text
tracker-frontend
tracker-backend
```

The deployment process uses immutable image digests rather than relying on a mutable `latest` tag for ECS deployments.

This means an ECS task definition references the exact container image that was built and published by CI/CD.

### VPC endpoints

The VPC uses endpoints for AWS services required by private resources.

The design includes endpoints for services such as:

- Amazon ECR API
- Amazon ECR Docker Registry
- Amazon S3
- AWS Secrets Manager
- CloudWatch Logs

This allows private ECS resources to communicate with required AWS services without introducing a NAT Gateway.

This was an intentional cost and architecture decision.

## Terraform

The infrastructure is defined as code under:

```text
terraform/
```

The Terraform project is modular and separates infrastructure responsibilities into reusable components.

The repository contains Terraform configuration for areas including:

- VPC networking
- Security groups
- VPC endpoints
- ECR
- ACM
- Cloudflare
- RDS
- Secrets Manager
- IAM
- CloudWatch Logs
- ALB
- ECS

The exact implementation and module configuration are defined in the Terraform source files and should be treated as the source of truth.

## Terraform remote state

Terraform state is stored remotely in Amazon S3.

The repository separates the Terraform backend bootstrap from the main application infrastructure:

```text
bootstrap/
    Terraform backend infrastructure

terraform/
    Main AWS application infrastructure
```

The bootstrap configuration creates and configures the S3 bucket used for Terraform state.

The main Terraform configuration uses a separate state key within that backend.

The state bucket uses security-focused configuration including:

- Versioning
- Public access blocking
- Bucket-owner-enforced object ownership
- Encryption
- TLS-only access
- Native S3 state locking where configured

The `bootstrap/README.md` contains the specific bootstrap and state migration instructions.

## CI/CD

GitHub Actions manages the application and infrastructure workflows.

The repository contains these workflows:

```text
.github/workflows/
├── application.yml
├── terraform.yml
├── terraform-plan.yml
└── terraform-destroy.yml
```

### Application workflow

The application workflow builds and publishes the frontend and backend container images.

The deployment flow is:

```text
Git push
   |
   v
GitHub Actions
   |
   +-- Build frontend image
   +-- Build backend image
   |
   v
Amazon ECR
   |
   v
Capture image digests
   |
   v
Terraform deployment
   |
   v
ECS task definitions/services
```

### Immutable deployments

The deployment uses image digests rather than depending on a mutable image tag.

Conceptually:

```text
Docker image
     |
     v
ECR
     |
     v
SHA-256 image digest
     |
     v
Terraform
     |
     v
ECS task definition
```

This makes deployments reproducible and ensures that ECS references the exact image produced by CI.

### Terraform plan workflow

Pull requests that change Terraform configuration are validated using:

- Terraform formatting checks
- Terraform initialization
- Terraform validation
- TFLint
- tfsec
- Terraform plan

The plan workflow is designed to identify infrastructure and security issues before changes are applied.

### Terraform apply workflow

The Terraform deployment workflow applies the infrastructure configuration and passes the application image digests into the deployment.

### Terraform destroy workflow

Infrastructure destruction is available through a manually triggered GitHub Actions workflow.

The destroy workflow requires an explicit confirmation value before running.

This provides an additional safeguard against accidental destruction of the AWS environment.

## AWS authentication

GitHub Actions uses AWS OIDC authentication rather than storing long-lived AWS access keys in GitHub secrets.

The general flow is:

```text
GitHub Actions
      |
      | OIDC token
      v
AWS IAM
      |
      v
Deployment role
      |
      v
AWS resources
```

The IAM trust policy restricts which GitHub repository/workflow context can assume the deployment role.

This removes the need to maintain permanent AWS access keys for CI/CD.

## Security

Security is implemented at multiple layers.

### Network security

- ALB is the public entry point.
- ECS tasks run in private subnets.
- RDS runs in private database subnets.
- Security groups restrict traffic between tiers.
- RDS is not publicly accessible.
- ECS tasks do not receive public IP addresses.
- Private route tables avoid unnecessary internet access.

### Secrets

Application secrets are not committed to the repository.

AWS Secrets Manager is used for sensitive configuration where required by the deployment.

RDS password management is handled using AWS-managed mechanisms where configured.

### Container images

Frontend and backend images are stored in ECR.

Deployments use immutable image digests so that an ECS deployment is tied to a specific image.

### CI/CD security

GitHub Actions uses OIDC authentication for AWS access.

Terraform security checks are also executed as part of CI/CD.

## Infrastructure security scanning

Terraform configuration is checked using:

```text
terraform fmt -check
terraform validate
tflint
tfsec
```

The security workflow uses tfsec with a minimum severity of HIGH.

This means HIGH and CRITICAL findings can block the pipeline, while lower-severity findings remain visible for review.

Where the Terraform code contains a deliberate `tfsec` ignore, the reason should be understood from the surrounding Terraform configuration rather than treated as an accidental bypass.

## Project structure

```text
tracker-ecs-project/
├── .github/
│   └── workflows/
├── backend/
├── frontend/
├── migrations/
├── bootstrap/
├── terraform/
├── docker-compose.yml
├── .tflint.hcl
├── README.md
└── screenshots/
    ├── application/
    ├── docker/
    ├── aws/
    ├── terraform/
    └── cicd/
```

### Main directories

| Directory            | Purpose                                    |
| -------------------- | ------------------------------------------ |
| `frontend/`          | Frontend application                       |
| `backend/`           | Backend API                                |
| `migrations/`        | PostgreSQL database migrations             |
| `bootstrap/`         | Terraform backend bootstrap                |
| `terraform/`         | Main AWS infrastructure                    |
| `.github/workflows/` | CI/CD workflows                            |
| `screenshots/`       | Project evidence and portfolio screenshots |

## Local development

The application can be run locally using Docker Compose.

Start the local environment with:

```bash
docker compose up --build
```

Docker Compose provides the local application services, including:

- Frontend
- Backend API
- PostgreSQL

The exact ports, environment variables, volumes, and service configuration are defined in `docker-compose.yml`.

## Deployment lifecycle

The overall infrastructure lifecycle is:

```text
1. Bootstrap Terraform state
          |
          v
2. Deploy AWS infrastructure
          |
          v
3. Build application images
          |
          v
4. Push images to ECR
          |
          v
5. Capture immutable image digests
          |
          v
6. Deploy ECS services with Terraform
          |
          v
7. Validate the application
          |
          v
8. Destroy infrastructure when testing is complete
```

The infrastructure was deployed and tested as part of the project.

After validation, the AWS resources were intentionally destroyed to avoid unnecessary ongoing costs.

## Cost considerations

Cost control was an important part of the infrastructure design.

The project avoids a NAT Gateway and instead uses VPC endpoints for required AWS service connectivity from private resources.

Other cost considerations include:

- ECS Fargate compute costs
- Application Load Balancer costs
- RDS costs
- ECR storage
- CloudWatch Logs
- VPC endpoint costs

Because this is a learning and portfolio project, the AWS infrastructure was destroyed after testing rather than being left running continuously.

The Terraform destroy workflow provides a controlled way to remove the main infrastructure when it is no longer required.

## Screenshots and evidence

Project evidence is organized under:

```text
screenshots/
├── application/
├── docker/
├── aws/
├── terraform/
└── cicd/
```

The folders are intended for real screenshots captured during development, deployment, testing, and troubleshooting.

Suggested evidence includes:

### Application

- Login/authentication
- Task dashboard
- Kanban board
- List/table view
- Filtering and search
- Dark mode

### Docker

- Docker Compose
- Running containers
- Built images

### AWS

- ECR repositories
- ECS cluster and services
- ALB
- Target groups
- RDS
- VPC/subnets/security groups
- CloudWatch Logs

### Terraform

- Terraform plan
- Terraform apply
- Terraform outputs
- Terraform destroy

### CI/CD

- Application workflow
- Terraform plan
- Terraform deployment
- Security scanning
- Destroy workflow

Historical AWS screenshots represent the environment during deployment and testing. They should not be interpreted as proof that the AWS environment is currently running.

## Key design decisions

### PostgreSQL

PostgreSQL was selected as the database for the project and is used both locally and in the AWS deployment.

### ECS Fargate

Fargate removes the need to manage EC2 instances for the container workloads and provides a simpler managed container runtime for this project.

### Private ECS tasks

The frontend and backend ECS tasks run without public IP addresses.

The ALB provides the public entry point while the application workloads remain inside private subnets.

### Private RDS

The database is isolated in private database subnets and is only accessible from the application tier through security-group rules.

### VPC endpoints instead of NAT Gateway

VPC endpoints provide the AWS service connectivity required by the private application tier without introducing a NAT Gateway.

This reduces the infrastructure cost for a small learning project.

### Terraform

Terraform provides repeatable infrastructure deployment and makes the AWS environment reproducible rather than dependent on manual ClickOps configuration.

### GitHub OIDC

OIDC removes the need for long-lived AWS credentials in GitHub Actions.

### Immutable image deployment

Image digests provide a deterministic reference to the container image deployed to ECS.

### Cloudflare

Cloudflare provides the DNS and edge layer in front of the AWS ALB. Route 53 is not required for this architecture.

## What I learned

This project provided practical experience with:

- Linux
- Git and GitHub
- Docker
- Docker Compose
- React
- Node.js
- PostgreSQL
- AWS VPC networking
- Public and private subnets
- Route tables
- Security groups
- VPC endpoints
- ECS Fargate
- Application Load Balancer
- Amazon ECR
- Amazon RDS
- AWS Secrets Manager
- IAM
- GitHub OIDC
- GitHub Actions
- Terraform
- Terraform remote state
- TFLint
- tfsec
- Cloudflare
- ACM
- Infrastructure deployment and destruction
- Troubleshooting private AWS networking

The project also reinforced the importance of validating infrastructure behavior rather than assuming that a successful Terraform apply means the application is working correctly.

## Project status

The following project areas were completed and tested:

- Full-stack task/project tracker
- Authentication and authorization
- JWT-based authentication
- PostgreSQL database
- Docker and Docker Compose
- Frontend and backend container images
- Amazon ECR
- AWS VPC networking
- Public and private subnet architecture
- Security groups
- VPC endpoints
- Amazon ECS Fargate
- Application Load Balancer
- Private RDS PostgreSQL
- AWS Secrets Manager integration
- Cloudflare DNS/TLS
- Terraform Infrastructure as Code
- Terraform remote state
- GitHub Actions CI/CD
- GitHub OIDC authentication
- Terraform formatting and validation
- TFLint
- tfsec security scanning
- Immutable container image deployment
- Controlled Terraform destroy workflow
- AWS deployment and application validation

The AWS infrastructure was subsequently destroyed to avoid ongoing costs.

## Notes for maintainers

- The root `README.md` documents the overall project.
- `bootstrap/README.md` documents the Terraform backend bootstrap process.
- Terraform configuration under `terraform/` is the source of truth for AWS infrastructure.
- GitHub Actions workflows under `.github/workflows/` are the source of truth for CI/CD behavior.
- Do not describe the AWS environment as currently running unless it has actually been redeployed.
- Keep documentation aligned with the actual Terraform configuration and workflow files.
- Avoid committing credentials, passwords, tokens, or other sensitive configuration.
