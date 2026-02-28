from app.models.user import Role

ROLE_HIERARCHY: dict[Role, int] = {
    Role.GAST: 0,
    Role.MITGLIED: 1,
    Role.VORSTAND: 2,
    Role.ADMIN: 3,
}


def has_minimum_role(user_role: Role, required_role: Role) -> bool:
    return ROLE_HIERARCHY.get(user_role, 0) >= ROLE_HIERARCHY.get(required_role, 0)
