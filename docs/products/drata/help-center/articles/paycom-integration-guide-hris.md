# Paycom Integration Guide (HRIS)

Source: https://help.drata.com/en/articles/14426678-paycom-integration-guide-hris
Collection: Connection Support › Other Guidance
Updated: 2026-04-01
Fetched: 2026-11-22

## Article text

Overview Connecting Paycom as an HRIS in Drata allows Drata to automatically track who is in scope for compliance, including employee start dates, separation dates, and employment status. This reduces manual work and helps ensure Drata is monitoring the right people at the right time.

## Key Capabilities

- Automatically sync personnel data such as employment status (active or former), start dates, and separation dates from Paycom into Drata for compliance monitoring.
- Keep personnel records up to date across Drata, improving accuracy for access reviews, device compliance, and policy assignments.
- Reduce manual updates to personnel status and lifecycle information during audits.

## Prerequisites & Access Requirements

- You must have an admin account in Paycom to establish the connection and work with your Paycom account manager.
- Your Paycom account manager must whitelist specific IP addresses before the connection can succeed (see Step 1 below).

Data Access

- Drata reads HRIS data only; it does not update or modify data in Paycom.
- Commonly synced attributes from HRIS systems include:
   - Employee name and email
   - Employment status (active or former)
   - Start date and separation date

## Step-by-Step Setup

### Step 1: Ask Paycom to Whitelist Required IP Addresses

Before you attempt to connect Paycom in Drata, your Paycom account manager must whitelist a set of IP addresses so that Paycom will accept traffic from the integration.

1. Contact your Paycom account manager.
2. Ask them to whitelist the following IP addresses:
   `44.194.126.11
   44.194.4.0
   3.232.227.174
   3.214.125.237
   54.158.121.71
   44.193.163.62`
3. Wait for confirmation from your Paycom account manager that these IP addresses have been allowlisted.
4. Do not proceed until this allowlisting is complete, or the connection attempt may fail.

### Step 2: Start the Paycom HRIS Connection in Drata

1. Log in to Drata as an Admin.
2. In the left navigation, go to Connections.
3. In the Connections experience, filter or browse by connection type and select the HRIS category.
4. Locate the Paycom connection card.
5. Select the Paycom connection to open the setup flow.
   - **Enter your account information** when prompted.
   - **Note:** You must use an **administrator account** to successfully establish the connection.

## Related articles

- [Rippling Integration Guide (HRIS, MDM, UAR)](rippling-integration-guide-hris-mdm-uar.md)
- [Connect your HRIS to Drata](connect-your-hris-to-drata.md)
- [Integrate Multiple Identity and HRIS Connections](integrate-multiple-identity-and-hris-connections.md)
- [How Drata Uses HRIS Data](how-drata-uses-hris-data.md)
- [Lattice HRIS Integration Guide](lattice-hris-integration-guide.md)
