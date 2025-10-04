"""Seed policy data for testing"""
import asyncio
from prisma import Prisma

prisma = Prisma()

async def seed_sample_policy():
    """Create a sample policy for eConsultation testing"""
    
    policy_text = """
# Proposed Amendment to Companies Act, 2013 - Section 135 (Corporate Social Responsibility)

## Background
The Ministry of Corporate Affairs proposes amendments to enhance Corporate Social Responsibility (CSR) compliance and transparency for Indian companies.

## Proposed Changes

### 1. CSR Spending Threshold
**Current Provision:** Companies with net worth of ₹500 crore or more, or turnover of ₹1000 crore or more, or net profit of ₹5 crore or more must spend at least 2% of average net profits on CSR activities.

**Proposed Amendment:** 
- Increase CSR spending requirement to 3% for companies with net profit exceeding ₹50 crore
- Introduce sliding scale: 2% for profits ₹5-50 crore, 3% for profits above ₹50 crore
- Mandate quarterly CSR reporting instead of annual

### 2. Eligible CSR Activities
**Addition of New Focus Areas:**
- Climate change mitigation and adaptation
- Digital literacy and cybersecurity awareness
- Support for MSMEs and startups in tier-2 and tier-3 cities
- Mental health initiatives

### 3. CSR Committee Composition
**Proposed Requirement:**
- At least one independent director with development sector experience
- Mandatory CSR training for all committee members
- Annual impact assessment by third-party evaluators

### 4. Unspent CSR Funds
**Current:** Unspent funds to be transferred to specified funds within 6 months
**Proposed:** 
- Automatic transfer within 3 months
- Increased penalties for non-compliance: 1% of required CSR amount per month of delay
- Public disclosure of reasons for underspending

### 5. Administrative Overheads
**Proposed Cap:** Maximum 5% of CSR budget can be used for administrative costs (down from current practice of 10-15%)

## Compliance Timeline
- Companies must align CSR policies within 6 months of amendment notification
- First compliance report under new framework due 9 months post-notification

## Penalty Provisions
- Non-compliance: Fine up to ₹10 lakh + imprisonment up to 3 years for officers
- False reporting: Additional penalty of ₹25 lakh

## Stakeholder Consultation Period
The Ministry invites comments from:
- Corporates and Industry Associations
- NGOs and Development Organizations
- Legal and Financial Experts
- General Public

**Deadline for Feedback:** 60 days from publication date
"""

    try:
        # Check if policy already exists
        existing = await prisma.policy.find_first(
            where={"title": {"contains": "Companies Act, 2013 - Section 135"}}
        )
        
        if existing:
            print(f"✓ Policy already exists: {existing.id}")
            # Update to active status
            await prisma.policy.update(
                where={"id": existing.id},
                data={"status": "active"}
            )
            return existing.id
        
        # Create new policy
        policy = await prisma.policy.create(
            data={
                "title": "Proposed Amendment to Companies Act, 2013 - Section 135 (CSR)",
                "description": "Amendment to enhance Corporate Social Responsibility compliance, increase CSR spending requirements to 3% for large companies, expand eligible activities, strengthen committee requirements, and tighten unspent funds regulations.",
                "fullText": policy_text,
                "version": "1.0",
                "status": "active",
                "category": "Corporate Law"
            }
        )
        
        print(f"✓ Created sample policy: {policy.id}")
        print(f"  Title: {policy.title}")
        print(f"  Status: {policy.status}")
        return policy.id
    
    except Exception as e:
        print(f"✗ Error seeding policy: {str(e)}")
        raise


async def main():
    """Main seed function"""
    print("\n=== Seeding Policy Data ===\n")
    
    try:
        await prisma.connect()
        policy_id = await seed_sample_policy()
        print(f"\n✓ Policy seeding complete! Policy ID: {policy_id}")
    except Exception as e:
        print(f"\n✗ Seeding failed: {str(e)}")
    finally:
        await prisma.disconnect()


if __name__ == "__main__":
    asyncio.run(main())
