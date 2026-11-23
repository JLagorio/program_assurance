# Connecting Private Git via AWS PrivateLink

Source: https://help.drata.com/en/articles/17070523-connecting-private-git-via-aws-privatelink
Collection: Connection Support › Version Control Guidance
Updated: 2026-11-14
Fetched: 2026-11-22

## Article text

[AWS PrivateLink](https://docs.aws.amazon.com/vpc/latest/privatelink/what-is-privatelink.html) lets Drata reach an internal service that has no public address. You publish a VPC endpoint service in front of it, Drata creates a matching interface endpoint, and Drata connects across AWS's private network, never the public internet.

The path looks like this:

`Drata → Interface endpoint → AWS PrivateLink → Your endpoint service → Your internal load balancer → Your service`

- **You are the provider:** you own the service, the load balancer in front of it, and the endpoint service that publishes it.
- **Drata is the consumer:** we create an interface endpoint that points at your service name, and you approve that connection before any traffic flows.
- **Traffic is one-directional.** Drata opens connections to you; you never open one to Drata. You need no internet egress or inbound internet access for this to work.
- Nothing is reachable until you add Drata's principal to your allow list and accept the connection — you control both of those steps.

---

## Prerequisite

You need five things in place. Everything else is created for you during setup.

1. **Your Git server on an EC2 instance**, serving HTTPS in a VPC you control.
2. **At least two subnets in different Availability Zones**. The second needs no target — cross-zone load balancing reaches the instance in the other zone. A single AZ is rejected outright for cross-Region access.
3. **A TLS certificate that already lists the hostname Drata (such as app.drata.com) will dial in its Subject Alternative Names (SANs)**. PrivateLink never terminates TLS, so the certificate Drata validates is the one your own server presents. If it's issued by a private CA (Certificate Authority), tell your Drata contact — that CA has to be added to the system, and nothing on your side can arrange that.
4. **The ability to publish a public TXT record for that domain**. AWS verifies domain ownership over the public internet; a private hosted zone cannot satisfy this.
5. **Terraform 1.5+ with AWS provider 5.100+**, and an IAM role that can call `ec2:ModifyVpcEndpointServiceConfiguration` and `ec2:StartVpcEndpointServicePrivateDnsVerification`, on top of the usual EC2 and ELB permissions.

**Additional notes:**

- This workflow is live for the GitLab self-managed connection.

---

## Pick your Region first

Deploy in the Region that serves your Drata tenant, and allow that Region's CIDR on your load balancer.

| **Drata Region** | **Drata CIDR to allow** |
|---|---|
| `us-west-2` | `10.0.0.0/16` |
| `eu-central-1` | `10.2.0.0/16` |
| `ap-southeast-2` | `10.10.0.0/16` |

If your Git server has to stay in a different Region, cross-Region access works: set `supported_regions` to the Drata Region. This needs the `vpce:AllowMultiRegion` IAM permission and two eligible Availability Zones.

**What each side hands over**

| **Direction ** | **What moves** |
|---|---|
| Drata → you | The principal ARN to allow, plus our Region and CIDR |
| You → Drata | The endpoint service name, the hostname, the port, and the Availability Zones your service covers |

Drata's production principal is `arn:aws:iam::269135526815:root`, which is the module's default. Allowing it lets us request a connection and nothing more — you still approve each one by hand.

---

## Step 1 — Put an internal load balancer in front of your service

An endpoint service can only publish a Network Load Balancer, so your service needs one in front of it. Drata provides a Terraform module that builds this and the endpoint service in a single apply:

```
module "privatelink" {
 source = "github.com/drata/terraform-aws-drata-privatelink"

 name = "gitlab-privatelink"
 vpc_id = "vpc-0123456789abcdef0"

 # At least two subnets, each in a different AZ.
 subnet_ids = ["subnet-aaaa", "subnet-bbbb"]

 target_instance_id = "i-0123456789abcdef0"
 target_port = 443

 # The Drata CIDR for your Region — see the table above.
  nlb_ingress_cidrs = ["10.2.0.0/16"]
}
```

This creates an internal NLB, a TCP target group pointing at your instance on `target_port`, and a security group for the load balancer. The listener is TCP, not TLS — that's what keeps your own certificate in play end to end.

The one thing this module cannot do for you: it does not touch your service's own security group. You need to allow ingress on the target port from the load balancer's security group, which the module returns as `nlb_security_group_id`.

If you'd rather not consume the module directly from GitHub, the resources it creates are ordinary Terraform — you can read them and replicate them inline. Be aware that you then own the drift: future fixes Drata publishes to the module won't reach you automatically, and each one has to be hand-carried.

### Watch the ingress CIDR

With security-group enforcement left on (the AWS default), the rules are matched against the client's private IP, not the endpoint interface in your VPC — so the range that matters is Drata's CIDR, not yours. A security group that admits only your own VPC CIDR will silently black-hole every connection Drata makes: no error, no reset, just a timeout. **This is the single most common way this setup fails.**

If the Drata CIDR overlaps your VPC, or you can't admit it, set `enforce_security_group_inbound_rules_on_private_link_traffic = "off"`. PrivateLink access is then gated by the allow list and manual acceptance alone, and the security group only governs direct traffic inside your VPC.

---

## Step 2 — Create the endpoint service and allow Drata

The same apply creates the endpoint service in front of your load balancer, with two settings that control who can reach it:

- `allowed_principals` — the IAM principals permitted to discover your service and request an endpoint to it. Defaults to Drata's production account root. You can leave it empty on the first apply and add the ARN later.
- `acceptance_required` — leave this at `true`. Every connection request then waits for your explicit approval.

Run `terraform apply` and read the service name off the output:

```
$ terraform output service_name
"com.amazonaws.vpce.eu-west-1.vpce-svc-0123456789abcdef0"
```

That name is what Drata needs, and it's the one value you can't regenerate. Every destroy and re-apply mints a new one, which breaks every consumer already connected. Treat the endpoint service as long-lived from the moment you share it.

Also note `service_availability_zones` in the output. Drata's subnets have to overlap those zones, and AWS matches on the physical AZ ID rather than the name shown in your console — so `eu-west-1a` in your account isn't necessarily `eu-west-1a` in Drata's.

---

## Step 3 — Attach a private DNS name

This step is technically optional to AWS but effectively mandatory in practice. Skip it, and the only address Drata has is the endpoint's auto-generated name:

```
vpce-0123456789abcdef0-a1b2c3d4.vpce-svc-0123456789abcdef0.eu-west-1.vpce.amazonaws.com
```

Since PrivateLink doesn't terminate TLS, the certificate on that connection is yours, and its SANs list your real hostname, not the vpce name — so normal certificate validation fails, and the connection would only work with verification switched off, which Drata will not do for customer data.

Setting `private_dns_name` to the hostname Drata already dials removes this problem. Once AWS verifies you own the domain, Drata enables private DNS on its endpoint, AWS maps the hostname to it inside Drata's VPC, and your certificate matches — neither side changes any application configuration.

AWS proves ownership by resolving a TXT record on the public internet.

**If your public hosted zone is in the same AWS account:** pass its ID and the module writes the record and waits for verification:

```
private_dns_name = "gitlab.example.com"
private_dns_validation_zone_id = "Z0123456789ABCDEFGHIJ"
```

**If your DNS is hosted anywhere else:** apply once with `private_dns_name` alone, publish the record from the outputs, then set `verify_private_dns_name = true` and apply again:

```
$ terraform output private_dns_verification_name
"_6e86v84tqgqubxbwii1m"
$ terraform output private_dns_verification_value
"vpce:l6p0ERxlTt45jevFwOCp"
```

| **Name** | **Type** | **Value** |
|---|---|---|
| `_6e86v84tqgqubxbwii1m.example.com` | TXT | `vpce:l6p0ERxlTt45jevFwOCp` |

Verifying a parent domain covers everything under it (`example.com` also covers `gitlab.example.com`). Some DNS providers lowercase TXT values or append the domain to the record name — both break verification.

### Two things that catch people out here

- **The name must match your certificate, and nothing checks that it does.** AWS verifies domain ownership, not your TLS certificate.
   - `private_dns_name` must appear in your certificate's SANs and must be the exact hostname Drata dials.
   - Get it wrong, and verification still succeeds, the name still resolves, but every handshake fails on a name mismatch at connect time, long after a clean apply.
   - Check it first:
      ```
$ openssl s_client -connect :443 -servername  \
 /dev/null \
 | openssl x509 -noout -subject -text | grep -A1 "Subject Alternative Name"
      ```
- **Adding a name to a service that already exists takes two applies.** AWS doesn't mint the verification token until the name is on the service, so the first plan fails on an empty lookup with a misleading `Invalid index` error. Apply once with `private_dns_validation_zone_id = null`, then add the zone and apply again. Do not use `-replace` to force it into one apply — it works, but it mints a new service name, breaking every consumer already connected to you.

---

## Step 4 — Hand off to Drata and accept the connection

Send your Drata support the four values: the endpoint service name, the hostname you attached as the private DNS name, the port your service listens on, and the Availability Zones from `service_availability_zones`.

Drata then creates an interface endpoint pointing at your service name, from the VPC that runs Autopilot. That request lands in your account as a pending connection — **approve it**. Until you do, nothing connects; that's the point of `acceptance_required`.

Accept it in the VPC console under **Endpoint services → Endpoint connections**, or with the CLI:

```
$ aws ec2 accept-vpc-endpoint-connections \
 --service-id vpce-svc-0123456789abcdef0 \
 --vpc-endpoint-ids vpce-0fedc
```

Once the connection reads `available` and your domain verification reads `verified`, Drata enables private DNS on its side. Drata also adds your hostname to an internal allow list at this point, since your service sits on a private address — that step is on Drata, not you, but it's why the hostname needs to be settled before this step rather than after.

Note that `private_dns_verification_state` is read before verification runs, so the apply that actually verifies your domain still prints `pendingVerification`. Re-run `terraform plan` or `terraform refresh` to see it settle.

---

## Step 5 — Connect the Version Control connector

An open network path isn't the same as a working connector. Whichever Drata integration you're setting up still authenticates to your service like any other client, using that connector's normal credentials — PrivateLink only solves the network path, not the login.

**Example — GitLab Version Control connector:**

1. Create a service account in GitLab and issue it a personal access token with the `read_api` and `read_user` scopes. Read-only is sufficient — Drata never writes to your repositories.
2. Make the token long-lived and note its expiry. A short-dated token is the quietest failure mode in this whole setup: the network keeps working, the endpoint stays available, and monitoring simply stops returning results.
3. Add the connection in Drata under Autopilot's Version Control connector, using the hostname you attached as the private DNS name and that token.

If you're connecting a different service, follow that connector's own setup guide for this step instead — steps 1–4 above (the PrivateLink network path) are identical no matter which service sits behind them.

---

## Verifying it works

Check these in order — a failure at one layer looks identical to a failure at the next:

1. **The endpoint service is up.** `terraform output service_state` reads `Available`, and the connection from Drata reads `available` in Endpoint connections.
2. **Domain ownership is verified.** `terraform output private_dns_verification_state` reads `verified`. While it doesn't, existing connections survive but new ones are refused.
3. **The target is healthy.** The target group shows your instance as `healthy`. The default probe is TCP on the traffic port; use `health_check_path` for an HTTP/HTTPS application-level check instead.
4. **TLS validates on the real hostname.** Drata tests this from a host inside the endpoint's subnet, using a check appropriate to your service. For example, a healthy self-managed GitLab instance answers `GET /api/v4/version` with `401` when unauthenticated, `GET /users/sign_in` with `200`, and `GET /` with `302` — all with the certificate validating cleanly, no `--insecure`.
5. **The connector completes.** The Version Control monitor in Drata runs and returns your repositories.

## Troubleshooting

| **Symptom** | **Likely cause** |
|---|---|
| Connection times out, no error or reset | The NLB security group doesn't admit the Drata CIDR.<br>Check the NLB's `SecurityGroupBlockedFlowCount_Inbound` metric — a security-group drop looks identical to a data-plane fault from Drata's side. |
| Drata cannot create its endpoint | Drata's principal isn't in `allowed_principals`, or your subnets don't overlap `service_availability_zones`. AWS matches on physical AZ ID, not AZ name. |
| Cross-Region endpoint rejected | `supported_regions` is unset, your IAM role lacks `vpce:AllowMultiRegion`, or the service covers only one AZ. |
| TLS handshake fails on name mismatch | `private_dns_name` isn't in the certificate's SANs, or isn't the exact hostname Drata dials. Nothing in the apply catches this. |
| TLS fails on an unknown issuer | Your certificate is from a private CA. Tell your Drata contact so it can be added to Drata's trust store. |
| Verification never completes | The TXT record is in a private hosted zone, or your DNS provider lowercased the value or appended the domain to the record name. |
| Plan fails with `Invalid index` on `private_dns_name_configuration` | You're adding a private DNS name to a service that already exists — split it across two applies (see Step 3). This is a known issue in the AWS Terraform provider ([hashicorp/terraform-provider-aws#24044](https://github.com/hashicorp/terraform-provider-aws/issues/24044), open as of provider 6.58) and can't be worked around inside the module. |
| Everything green, monitor returns nothing | The access token expired, or its scopes are insufficient for your connector (for GitLab, `read_api` and `read_user`). |

## Keeping it healthy

Five things can break a working connection after the fact. All of them are on your side, and none of them will warn you before they do:

1. **Never destroy and re-create the endpoint service.** A rebuild mints a new service name and restarts onboarding from scratch.
2. **Renew your TLS certificate so it still covers the hostname.** PrivateLink and the load balancer are pass-through and never terminate TLS, so a renewed certificate that drops the name breaks the connector on validation.
3. **Leave the verification TXT record in place.** Removing it drops domain verification — existing connections survive, but new ones are refused and name resolution on Drata's side stops.
4. **Rotate the access token before it expires.** Set a calendar reminder; there is no warning when it lapses.
5. **Coordinate any AZ or load balancer change with Drata.** The endpoint service advertises specific Availability Zones, and a change on your side can leave Drata's subnets with nothing to reach.

If you ever revisit the security group: turning `enforce_security_group_inbound_rules_on_private_link_traffic` from `"off"` to `"on"` immediately requires the Drata CIDR to be admitted, or every connection black-holes with no error.

## Related articles

- [AWS Integration Guide (Infrastructure, User Access Review)](aws-integration-guide-infrastructure-user-access-review.md)
- [AWS Resource Permissions](aws-resource-permissions.md)
- [AWS Org Units Connection Instructions](aws-org-units-connection-instructions.md)
- [Test 224: AWS VPC Flow Logging](test-224-aws-vpc-flow-logging.md)
- [Identify and Add Missing AWS Permissions for Drata](identify-and-add-missing-aws-permissions-for-drata.md)
