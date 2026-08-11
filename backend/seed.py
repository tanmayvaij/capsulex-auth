import asyncio
import secrets
from sqlalchemy import select
from core.security import get_password_hash
from db.session import AsyncSessionLocal
from models.developer import Developer
from models.project import Project
from models.user import User

async def seed_data():
    async with AsyncSessionLocal() as session:
        print("Seeding developers...")
        developers = []
        for i in range(1, 11):
            # Check if dev exists to avoid unique constraint errors
            result = await session.execute(select(Developer).where(Developer.email == f"developer{i}@seed.com"))
            dev = result.scalar_one_or_none()
            if not dev:
                dev = Developer(
                    email=f"developer{i}@seed.com",
                    hashed_password=get_password_hash("password123"),
                    is_active=True
                )
                session.add(dev)
                developers.append(dev)
        
        await session.commit()
        
        for dev in developers:
            await session.refresh(dev)
            
        # Re-fetch all seed developers
        result = await session.execute(select(Developer).where(Developer.email.like("%@seed.com")))
        all_seed_devs = result.scalars().all()
            
        print("Seeding projects...")
        projects = []
        for dev in all_seed_devs:
            # Check if project exists
            proj_result = await session.execute(select(Project).where(Project.developer_id == dev.id))
            existing_projs = proj_result.scalars().all()
            if len(existing_projs) < 5:
                for j in range(len(existing_projs) + 1, 6):
                    project = Project(
                        developer_id=dev.id,
                        name=f"Project {j} for {dev.email.split('@')[0]}",
                        api_key=f"sk_test_{secrets.token_hex(16)}",
                    )
                    session.add(project)
                    projects.append(project)
                
        await session.commit()
        
        for proj in projects:
            await session.refresh(proj)
            
        # Re-fetch all seed projects
        result = await session.execute(select(Project).where(Project.name.like("Project % for developer%")))
        all_seed_projs = result.scalars().all()
            
        print("Seeding users...")
        for proj in all_seed_projs:
            user_result = await session.execute(select(User).where(User.project_id == proj.id))
            existing_users = user_result.scalars().all()
            if len(existing_users) < 10:
                for k in range(len(existing_users) + 1, 11):
                    user = User(
                        email=f"user{k}_proj{proj.id}@example.com",
                        project_id=proj.id,
                        hashed_password=get_password_hash("password123"),
                        is_active=True,
                        is_email_verified=True
                    )
                    session.add(user)
                
        await session.commit()
        print("Seeding complete!")

if __name__ == "__main__":
    asyncio.run(seed_data())
