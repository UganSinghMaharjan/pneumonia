from django.contrib.auth.hashers import PBKDF2PasswordHasher


class FastPBKDF2PasswordHasher(PBKDF2PasswordHasher):
    """
    A faster PBKDF2 hasher for development use only.
    Reduces iterations to 1 so login is near-instant.
    Existing passwords hashed with the default hasher still verify
    correctly — Django automatically falls back to PBKDF2PasswordHasher.
    """
    iterations = 1
