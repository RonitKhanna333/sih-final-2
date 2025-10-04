"""
Seed Script - Add Sample Feedback Comments for Testing USP Features

This script adds realistic sample feedback comments covering various policy areas
relevant to India in 2025, including:
- Digital India initiatives
- Healthcare reforms
- Agricultural policies
- Data privacy regulations
- Environmental policies
- Education reforms

Run: python seed_data.py
"""
import asyncio
import sys
from datetime import datetime, timedelta
import random
from prisma import Prisma

# Sample feedback data covering diverse policy areas and stakeholder perspectives
SAMPLE_FEEDBACK = [
    # Digital India 2.0 - Positive sentiment
    {
        "text": "The Digital India 2.0 initiative is transformative! 5G rollout in rural areas will bridge the digital divide and empower millions. We strongly support this policy.",
        "sentiment": "Positive",
        "language": "en",
        "stakeholderType": "Technology Companies",
        "sector": "Technology",
        "nuances": ["supportive", "enthusiastic"],
        "summary": "Strong support for Digital India 2.0 and rural 5G rollout"
    },
    {
        "text": "डिजिटल इंडिया 2.0 ग्रामीण क्षेत्रों के लिए बहुत अच्छा है। इससे रोजगार के नए अवसर मिलेंगे।",
        "sentiment": "Positive",
        "language": "hi",
        "stakeholderType": "Citizens",
        "sector": "General Public",
        "nuances": ["hopeful", "optimistic"],
        "summary": "Support for Digital India 2.0 creating rural employment opportunities"
    },
    
    # Digital India 2.0 - Concerns about implementation
    {
        "text": "While Digital India 2.0 sounds promising, the lack of digital literacy programs is concerning. How will rural citizens use these services without proper training?",
        "sentiment": "Neutral",
        "language": "en",
        "stakeholderType": "NGOs",
        "sector": "Education",
        "nuances": ["concerned", "questioning"],
        "summary": "Concern about digital literacy gap in rural implementation"
    },
    {
        "text": "5G infrastructure is expensive. Small telecom operators cannot afford the rollout costs. This policy favors large corporations over local businesses.",
        "sentiment": "Negative",
        "language": "en",
        "stakeholderType": "Small Businesses",
        "sector": "Telecommunications",
        "nuances": ["frustrated", "financial concerns"],
        "summary": "Cost concerns for small telecom operators in 5G rollout"
    },
    
    # Data Privacy Regulations - Mixed reactions
    {
        "text": "The proposed 48-hour data breach notification requirement is too stringent. We need at least 72 hours to investigate and prepare accurate disclosures. Rushing could lead to misinformation.",
        "sentiment": "Negative",
        "language": "en",
        "stakeholderType": "Technology Companies",
        "sector": "Technology",
        "nuances": ["concerned", "analytical"],
        "summary": "Tech companies oppose 48-hour breach notification as too restrictive"
    },
    {
        "text": "48 hours is still too long! Data breaches affect millions. Citizens deserve immediate notification. Privacy advocates demand 24-hour notification mandate.",
        "sentiment": "Negative",
        "language": "en",
        "stakeholderType": "Privacy Advocates",
        "sector": "Civil Society",
        "nuances": ["urgent", "demanding"],
        "summary": "Privacy advocates want even faster breach notification (24 hours)"
    },
    {
        "text": "The new data privacy law is balanced and forward-thinking. It protects citizens while allowing businesses to innovate. India is setting a global standard.",
        "sentiment": "Positive",
        "language": "en",
        "stakeholderType": "Legal Experts",
        "sector": "Legal",
        "nuances": ["approving", "analytical"],
        "summary": "Legal experts praise balanced approach to data privacy"
    },
    
    # Healthcare Reforms - Ayushman Bharat expansion
    {
        "text": "Expanding Ayushman Bharat to cover all senior citizens is excellent! My parents will finally have healthcare coverage. This is a life-changing policy.",
        "sentiment": "Positive",
        "language": "en",
        "stakeholderType": "Citizens",
        "sector": "Healthcare",
        "nuances": ["grateful", "relieved"],
        "summary": "Citizens welcome Ayushman Bharat expansion for senior citizens"
    },
    {
        "text": "आयुष्मान भारत योजना अच्छी है लेकिन गांव में अस्पताल नहीं हैं। पहले अस्पताल बनाओ, फिर बीमा दो।",
        "sentiment": "Neutral",
        "language": "hi",
        "stakeholderType": "Citizens",
        "sector": "Healthcare",
        "nuances": ["practical", "concerned"],
        "summary": "Rural citizens want hospital infrastructure before insurance expansion"
    },
    {
        "text": "The healthcare expansion will bankrupt the budget! Where is the fiscal analysis? We cannot afford universal healthcare without raising taxes significantly.",
        "sentiment": "Negative",
        "language": "en",
        "stakeholderType": "Opposition Parties",
        "sector": "Politics",
        "nuances": ["critical", "fiscal concerns"],
        "summary": "Opposition questions fiscal sustainability of healthcare expansion"
    },
    
    # Agricultural Reforms - MSP and Subsidies
    {
        "text": "Removing fertilizer subsidies will destroy small farmers! We already struggle with rising costs. This policy shows government doesn't care about farmers.",
        "sentiment": "Negative",
        "language": "en",
        "stakeholderType": "Farmers",
        "sector": "Agriculture",
        "nuances": ["angry", "distressed"],
        "summary": "Farmers strongly oppose removal of fertilizer subsidies"
    },
    {
        "text": "MSP guarantee for 23 crops is a welcome step. But implementation must be monitored. Too often, farmers don't receive MSP in reality.",
        "sentiment": "Neutral",
        "language": "en",
        "stakeholderType": "Farmers",
        "sector": "Agriculture",
        "nuances": ["cautiously optimistic", "skeptical"],
        "summary": "Farmers support MSP expansion but doubt implementation"
    },
    {
        "text": "Direct benefit transfer for agricultural subsidies is efficient and reduces leakage. This reform will save billions and ensure money reaches farmers directly.",
        "sentiment": "Positive",
        "language": "en",
        "stakeholderType": "Government Officials",
        "sector": "Agriculture",
        "nuances": ["confident", "reformist"],
        "summary": "Officials praise DBT for agricultural subsidies as efficient"
    },
    
    # Environmental Policies - EV Adoption
    {
        "text": "Electric vehicle subsidies are great but charging infrastructure is missing. I want to buy an EV but there are no charging stations in my city.",
        "sentiment": "Neutral",
        "language": "en",
        "stakeholderType": "Citizens",
        "sector": "Environment",
        "nuances": ["interested", "concerned"],
        "summary": "Citizens want EV charging infrastructure before adoption"
    },
    {
        "text": "बैटरी की कीमत बहुत ज्यादा है। इलेक्ट्रिक वाहन आम आदमी के लिए नहीं है।",
        "sentiment": "Negative",
        "language": "hi",
        "stakeholderType": "Citizens",
        "sector": "Transportation",
        "nuances": ["concerned", "financial constraints"],
        "summary": "Citizens find electric vehicles too expensive despite subsidies"
    },
    {
        "text": "India's commitment to 30% EV adoption by 2030 is ambitious and achievable. Our company is investing heavily in battery manufacturing. Full support!",
        "sentiment": "Positive",
        "language": "en",
        "stakeholderType": "Industry Associations",
        "sector": "Automotive",
        "nuances": ["enthusiastic", "committed"],
        "summary": "Auto industry supports ambitious EV adoption targets"
    },
    
    # Education Reforms - NEP 2020 Implementation
    {
        "text": "The New Education Policy's focus on vocational training is excellent. Students need practical skills, not just theoretical knowledge. This will boost employability.",
        "sentiment": "Positive",
        "language": "en",
        "stakeholderType": "Educational Institutions",
        "sector": "Education",
        "nuances": ["approving", "practical"],
        "summary": "Educational institutions praise NEP's vocational training focus"
    },
    {
        "text": "Regional language education is important but English proficiency cannot be compromised. Students need English for global competitiveness.",
        "sentiment": "Neutral",
        "language": "en",
        "stakeholderType": "Parents",
        "sector": "Education",
        "nuances": ["concerned", "balanced"],
        "summary": "Parents want both regional languages and English proficiency"
    },
    {
        "text": "शिक्षकों का प्रशिक्षण जरूरी है। नई शिक्षा नीति अच्छी है लेकिन शिक्षक तैयार नहीं हैं।",
        "sentiment": "Neutral",
        "language": "hi",
        "stakeholderType": "Teachers Unions",
        "sector": "Education",
        "nuances": ["concerned", "practical"],
        "summary": "Teachers unions say NEP needs better teacher training programs"
    },
    
    # Taxation and GST Reforms
    {
        "text": "GST rate rationalization is overdue. Too many slabs create confusion. Moving to 3 slabs (5%, 15%, 28%) will simplify compliance and reduce litigation.",
        "sentiment": "Positive",
        "language": "en",
        "stakeholderType": "Industry Associations",
        "sector": "Finance",
        "nuances": ["supportive", "analytical"],
        "summary": "Industry supports GST slab reduction for simplification"
    },
    {
        "text": "Lower tax rates for startups are encouraging but compliance burden is still high. Simplify tax filing processes to truly help small businesses grow.",
        "sentiment": "Neutral",
        "language": "en",
        "stakeholderType": "Startups",
        "sector": "Technology",
        "nuances": ["appreciative", "requesting"],
        "summary": "Startups want tax filing simplification alongside lower rates"
    },
    
    # Urban Development and Smart Cities
    {
        "text": "Smart Cities Mission has transformed urban infrastructure. Pune's intelligent traffic system reduced congestion by 40%. More cities should adopt this model.",
        "sentiment": "Positive",
        "language": "en",
        "stakeholderType": "Municipal Corporations",
        "sector": "Urban Development",
        "nuances": ["proud", "data-driven"],
        "summary": "Municipal bodies cite successful smart city implementations"
    },
    {
        "text": "Smart cities only benefit the rich. What about slum redevelopment? Basic sanitation and housing should be prioritized over fancy technology.",
        "sentiment": "Negative",
        "language": "en",
        "stakeholderType": "Social Activists",
        "sector": "Urban Development",
        "nuances": ["critical", "equity-focused"],
        "summary": "Activists say smart cities ignore poor communities' basic needs"
    },
    
    # Women's Safety and Empowerment
    {
        "text": "Mandatory panic buttons in public transport is a good start but not enough. We need behavioral change, not just technology. Focus on education and awareness.",
        "sentiment": "Neutral",
        "language": "en",
        "stakeholderType": "Women's Rights Organizations",
        "sector": "Social Welfare",
        "nuances": ["appreciative", "demanding more"],
        "summary": "Women's groups want behavioral change alongside safety tech"
    },
    {
        "text": "महिला उद्यमियों के लिए विशेष ऋण योजना बहुत अच्छी है। यह महिलाओं को आत्मनिर्भर बनाएगी।",
        "sentiment": "Positive",
        "language": "hi",
        "stakeholderType": "Citizens",
        "sector": "Finance",
        "nuances": ["hopeful", "empowered"],
        "summary": "Women entrepreneurs welcome special loan schemes"
    },
    
    # Labor Reforms and Gig Economy
    {
        "text": "The new labor codes are anti-worker! Removing job security protections will lead to mass exploitation. Workers need protection, not corporate-friendly laws.",
        "sentiment": "Negative",
        "language": "en",
        "stakeholderType": "Labor Unions",
        "sector": "Labor",
        "nuances": ["angry", "protective"],
        "summary": "Labor unions strongly oppose new labor code reforms"
    },
    {
        "text": "Gig workers need social security! We work 12 hours daily but have no benefits. Extend ESI and PF to delivery partners and ride-sharing drivers.",
        "sentiment": "Negative",
        "language": "en",
        "stakeholderType": "Gig Workers",
        "sector": "Labor",
        "nuances": ["demanding", "frustrated"],
        "summary": "Gig workers demand social security benefits and protections"
    },
    {
        "text": "Flexible labor laws will attract foreign investment and create jobs. India needs to compete globally. These reforms are necessary for economic growth.",
        "sentiment": "Positive",
        "language": "en",
        "stakeholderType": "Industry Associations",
        "sector": "Manufacturing",
        "nuances": ["pragmatic", "growth-focused"],
        "summary": "Industry sees labor reforms as essential for competitiveness"
    },
    
    # Renewable Energy and Climate
    {
        "text": "Solar panel import duties are hurting renewable energy adoption. Domestic manufacturing is not ready yet. Remove duties to accelerate solar capacity addition.",
        "sentiment": "Negative",
        "language": "en",
        "stakeholderType": "Renewable Energy Companies",
        "sector": "Energy",
        "nuances": ["concerned", "urgent"],
        "summary": "Solar companies want import duty removal for faster adoption"
    },
    {
        "text": "Green hydrogen mission is visionary! India can become a global leader in clean energy. Full support for this initiative. Need more government incentives.",
        "sentiment": "Positive",
        "language": "en",
        "stakeholderType": "Technology Companies",
        "sector": "Energy",
        "nuances": ["enthusiastic", "forward-looking"],
        "summary": "Tech firms support green hydrogen mission with more incentives"
    },
    
    # Cryptocurrency and Fintech Regulation
    {
        "text": "Blanket ban on cryptocurrency is regressive! India will fall behind in blockchain innovation. Regulate, don't prohibit. Learn from global best practices.",
        "sentiment": "Negative",
        "language": "en",
        "stakeholderType": "Fintech Companies",
        "sector": "Finance",
        "nuances": ["frustrated", "innovative"],
        "summary": "Fintech firms oppose crypto ban, demand regulation instead"
    },
    {
        "text": "Cryptocurrency is used for money laundering and tax evasion. Strong regulation is needed to protect ordinary citizens from fraud and scams.",
        "sentiment": "Negative",
        "language": "en",
        "stakeholderType": "Regulatory Bodies",
        "sector": "Finance",
        "nuances": ["cautious", "protective"],
        "summary": "Regulators emphasize need for strict crypto controls"
    },
    {
        "text": "UPI's success shows India leads in digital payments. Building on this with CBDC (Central Bank Digital Currency) is the right approach instead of private crypto.",
        "sentiment": "Positive",
        "language": "en",
        "stakeholderType": "Government Officials",
        "sector": "Finance",
        "nuances": ["proud", "strategic"],
        "summary": "Officials prefer CBDC over private cryptocurrencies"
    },
    
    # Tourism and Cultural Heritage
    {
        "text": "E-visa expansion to 150+ countries is excellent for tourism. But infrastructure at tourist sites needs improvement. Cleanliness and facilities are poor.",
        "sentiment": "Neutral",
        "language": "en",
        "stakeholderType": "Tourism Industry",
        "sector": "Tourism",
        "nuances": ["appreciative", "concerned"],
        "summary": "Tourism industry wants infrastructure improvement with visa expansion"
    },
    {
        "text": "पर्यटन स्थलों पर ज्यादा भीड़ से स्मारक खराब हो रहे हैं। विरासत संरक्षण जरूरी है।",
        "sentiment": "Negative",
        "language": "hi",
        "stakeholderType": "Heritage Conservationists",
        "sector": "Culture",
        "nuances": ["concerned", "protective"],
        "summary": "Conservationists worry overtourism damages heritage sites"
    },
    
    # Space and Technology
    {
        "text": "Opening space sector to private players is transformative! India's space startups will compete globally. Chandrayaan and Gaganyaan prove our capabilities.",
        "sentiment": "Positive",
        "language": "en",
        "stakeholderType": "Startups",
        "sector": "Space Technology",
        "nuances": ["excited", "ambitious"],
        "summary": "Space startups enthusiastic about privatization of space sector"
    },
    {
        "text": "Quantum computing research needs more funding. China is far ahead. India must invest heavily in emerging technologies to remain competitive.",
        "sentiment": "Neutral",
        "language": "en",
        "stakeholderType": "Research Institutions",
        "sector": "Technology",
        "nuances": ["concerned", "competitive"],
        "summary": "Researchers demand more quantum computing funding"
    },
    
    # Food Security and PDS
    {
        "text": "राशन की गुणवत्ता खराब है। सार्वजनिक वितरण प्रणाली में सुधार चाहिए।",
        "sentiment": "Negative",
        "language": "hi",
        "stakeholderType": "Citizens",
        "sector": "Food Security",
        "nuances": ["dissatisfied", "demanding"],
        "summary": "Citizens complain about poor quality in public distribution system"
    },
    {
        "text": "Aadhaar-linked PDS has reduced leakages significantly. Food grain distribution is more efficient and reaches intended beneficiaries.",
        "sentiment": "Positive",
        "language": "en",
        "stakeholderType": "Government Officials",
        "sector": "Food Security",
        "nuances": ["confident", "data-driven"],
        "summary": "Officials cite Aadhaar-PDS success in reducing leakages"
    },
    
    # Manufacturing and Make in India
    {
        "text": "Production-Linked Incentive (PLI) scheme is working! Electronics manufacturing has grown 300%. Extend PLI to more sectors for comprehensive growth.",
        "sentiment": "Positive",
        "language": "en",
        "stakeholderType": "Industry Associations",
        "sector": "Manufacturing",
        "nuances": ["successful", "expansionist"],
        "summary": "Industry celebrates PLI success, wants expansion to more sectors"
    },
    {
        "text": "Make in India sounds good but land acquisition and regulatory clearances take years. Ease of doing business needs real improvement, not just rankings.",
        "sentiment": "Negative",
        "language": "en",
        "stakeholderType": "Foreign Investors",
        "sector": "Manufacturing",
        "nuances": ["frustrated", "practical"],
        "summary": "Foreign investors cite regulatory delays despite Make in India push"
    },
    
    # Water Resources and Conservation
    {
        "text": "Jal Jeevan Mission providing tap water to rural homes is life-changing. Women no longer walk kilometers for water. This is real development.",
        "sentiment": "Positive",
        "language": "en",
        "stakeholderType": "Citizens",
        "sector": "Water Resources",
        "nuances": ["grateful", "transformative"],
        "summary": "Rural citizens praise Jal Jeevan Mission for household tap water"
    },
    {
        "text": "जल संरक्षण के बिना नल का पानी टिकाऊ नहीं है। वर्षा जल संचयन अनिवार्य करो।",
        "sentiment": "Neutral",
        "language": "hi",
        "stakeholderType": "Environmental Groups",
        "sector": "Environment",
        "nuances": ["concerned", "sustainable-focused"],
        "summary": "Environmentalists want mandatory rainwater harvesting with water supply"
    },
    
    # Additional diverse perspectives (40+ more)
    {
        "text": "The new telecom reforms will reduce call drop rates and improve network quality. Consumers will finally get value for money.",
        "sentiment": "Positive",
        "language": "en",
        "stakeholderType": "Consumer Rights Groups",
        "sector": "Telecommunications",
        "nuances": ["hopeful", "consumer-focused"],
        "summary": "Consumer groups expect better telecom quality from reforms"
    },
    {
        "text": "Farmer Producer Organizations (FPOs) are empowering small farmers through collective bargaining. More support needed for FPO formation and training.",
        "sentiment": "Positive",
        "language": "en",
        "stakeholderType": "Farmers",
        "sector": "Agriculture",
        "nuances": ["empowered", "collaborative"],
        "summary": "Farmers support FPO model for collective bargaining power"
    },
    {
        "text": "स्किल इंडिया कार्यक्रम अच्छा है लेकिन प्रशिक्षण के बाद नौकरी नहीं मिलती। रोजगार गारंटी चाहिए।",
        "sentiment": "Neutral",
        "language": "hi",
        "stakeholderType": "Youth",
        "sector": "Employment",
        "nuances": ["disappointed", "seeking outcomes"],
        "summary": "Youth want job guarantees after completing skill training programs"
    },
    {
        "text": "Startup India initiative created a vibrant ecosystem. Tax benefits and easy compliance helped thousands of entrepreneurs. Continue this support!",
        "sentiment": "Positive",
        "language": "en",
        "stakeholderType": "Startups",
        "sector": "Technology",
        "nuances": ["grateful", "entrepreneurial"],
        "summary": "Startups credit Startup India initiative for thriving ecosystem"
    },
    {
        "text": "Animal welfare laws need stronger enforcement. Stray animal management requires humane solutions, not culling. Sterilization programs need scaling.",
        "sentiment": "Neutral",
        "language": "en",
        "stakeholderType": "Animal Welfare Organizations",
        "sector": "Social Welfare",
        "nuances": ["concerned", "compassionate"],
        "summary": "Animal welfare groups want humane stray management solutions"
    },
    {
        "text": "Cybersecurity threats are growing. National Cyber Security Policy needs regular updates. Critical infrastructure protection is national priority.",
        "sentiment": "Negative",
        "language": "en",
        "stakeholderType": "Security Experts",
        "sector": "Technology",
        "nuances": ["urgent", "security-focused"],
        "summary": "Security experts demand updated cybersecurity policies"
    },
    {
        "text": "PMAY (Pradhan Mantri Awas Yojana) helped millions get affordable housing. But quality of construction is sometimes poor. Need better quality control.",
        "sentiment": "Neutral",
        "language": "en",
        "stakeholderType": "Citizens",
        "sector": "Housing",
        "nuances": ["appreciative", "quality-conscious"],
        "summary": "Housing beneficiaries want construction quality improvement in PMAY"
    },
    {
        "text": "एयर इंडिया का निजीकरण सही निर्णय था। सेवा में सुधार हो रहा है।",
        "sentiment": "Positive",
        "language": "hi",
        "stakeholderType": "Citizens",
        "sector": "Aviation",
        "nuances": ["satisfied", "service-focused"],
        "summary": "Citizens see service improvement after Air India privatization"
    },
    {
        "text": "Medical education reforms needed urgently. Doctor shortage in rural areas is crisis. Increase MBBS seats and rural postings should be mandatory.",
        "sentiment": "Negative",
        "language": "en",
        "stakeholderType": "Healthcare Professionals",
        "sector": "Healthcare",
        "nuances": ["urgent", "crisis-mode"],
        "summary": "Doctors demand more medical seats and mandatory rural service"
    },
    {
        "text": "Sports infrastructure investment is finally happening. India's Olympic performance improved. Continue support for athletes and grassroots sports.",
        "sentiment": "Positive",
        "language": "en",
        "stakeholderType": "Sports Bodies",
        "sector": "Sports",
        "nuances": ["encouraged", "performance-driven"],
        "summary": "Sports bodies see improved performance from infrastructure investment"
    },
]


async def seed_database():
    """Add sample feedback to database"""
    prisma = Prisma()
    
    try:
        await prisma.connect()
        print("✅ Connected to database")
        
        # Check existing feedback count
        existing_count = await prisma.feedback.count()
        print(f"📊 Existing feedback entries: {existing_count}")
        
        if existing_count > 50:
            response = input(f"Database already has {existing_count} entries. Add {len(SAMPLE_FEEDBACK)} more? (y/n): ")
            if response.lower() != 'y':
                print("❌ Seeding cancelled")
                return
        
        # Add sample feedback with varied timestamps (last 30 days)
        added_count = 0
        skipped_count = 0
        
        for idx, feedback in enumerate(SAMPLE_FEEDBACK):
            try:
                # Generate varied timestamps over last 30 days
                days_ago = random.randint(0, 30)
                hours_ago = random.randint(0, 23)
                created_at = datetime.now() - timedelta(days=days_ago, hours=hours_ago)
                
                # Prepare data
                data = {
                    "text": feedback["text"],
                    "sentiment": feedback["sentiment"],
                    "language": feedback["language"],
                    "nuances": feedback["nuances"],
                    "isSpam": False,
                    "legalRiskScore": random.uniform(0.1, 0.5),  # Low to medium risk
                    "complianceDifficultyScore": random.uniform(0.2, 0.6),
                    "businessGrowthScore": random.uniform(0.3, 0.8),
                    "edgeCaseFlags": [],
                    "createdAt": created_at,
                }
                
                # Add optional fields
                if feedback.get("stakeholderType"):
                    data["stakeholderType"] = feedback["stakeholderType"]
                if feedback.get("sector"):
                    data["sector"] = feedback["sector"]
                if feedback.get("summary"):
                    data["summary"] = feedback["summary"]
                
                await prisma.feedback.create(data=data)
                added_count += 1
                print(f"✅ [{added_count}/{len(SAMPLE_FEEDBACK)}] Added: {feedback['summary'][:60]}...")
                
            except Exception as e:
                skipped_count += 1
                print(f"⚠️  Skipped entry {idx + 1}: {e}")
        
        print("\n" + "="*80)
        print(f"🎉 Seeding Complete!")
        print(f"✅ Successfully added: {added_count} feedback entries")
        if skipped_count > 0:
            print(f"⚠️  Skipped: {skipped_count} entries (likely duplicates or errors)")
        
        # Show final statistics
        final_count = await prisma.feedback.count()
        sentiment_breakdown = await prisma.feedback.group_by(
            by=['sentiment'],
            count=True
        )
        
        print(f"\n📊 Database Statistics:")
        print(f"   Total Feedback: {final_count}")
        print(f"   Sentiment Breakdown:")
        for item in sentiment_breakdown:
            print(f"      - {item['sentiment']}: {item['_count']} entries")
        
        print("\n🚀 Your database is now ready for testing USP features!")
        print("\nRecommended next steps:")
        print("1. Start backend: cd backend && python main.py")
        print("2. Start frontend: cd frontend && npm run dev")
        print("3. Login as admin and test:")
        print("   - Policy Sandbox: Test policy simulation")
        print("   - Debate Map: Generate opinion visualization")
        print("   - AI Documents: Create briefing/response documents")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    
    finally:
        await prisma.disconnect()
        print("\n✅ Database connection closed")


if __name__ == "__main__":
    print("="*80)
    print("🌱 Sample Feedback Data Seeding Script")
    print("="*80)
    print(f"\nThis will add {len(SAMPLE_FEEDBACK)} sample feedback entries covering:")
    print("  - Digital India 2.0 initiatives")
    print("  - Data privacy regulations")
    print("  - Healthcare reforms (Ayushman Bharat)")
    print("  - Agricultural policies (MSP, subsidies)")
    print("  - Environmental policies (EV adoption)")
    print("  - Education reforms (NEP 2020)")
    print("  - Labor reforms and gig economy")
    print("  - Renewable energy and climate")
    print("  - Cryptocurrency and fintech regulation")
    print("  - And 30+ other diverse policy areas\n")
    print("Stakeholder perspectives include:")
    print("  - Citizens, Farmers, Youth")
    print("  - Technology Companies, Startups")
    print("  - Government Officials, Opposition")
    print("  - NGOs, Industry Associations")
    print("  - Legal Experts, Privacy Advocates")
    print("  - And many more...\n")
    
    asyncio.run(seed_database())
