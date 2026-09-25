from django.test import TestCase
from api.views import validate_contact_number, validate_password

class ContactValidationTests(TestCase):
    def test_valid_contact_numbers(self):
        valid_numbers = [
            "",
            None,
            "1234567890",
            "9812345678",
            "9841234567",
        ]
        for num in valid_numbers:
            is_valid, err = validate_contact_number(num)
            self.assertTrue(is_valid, f"Expected {num} to be valid, got error: {err}")
            self.assertIsNone(err)

    def test_invalid_contact_numbers(self):
        invalid_numbers = [
            "12345",              # Too short (< 10 digits)
            "12345678901",        # Too long (> 10 digits)
            "+1800555019",        # Contains +
            "981234567a",        # Contains letter
            "981234567!",        # Contains special character
        ]
        for num in invalid_numbers:
            is_valid, err = validate_contact_number(num)
            self.assertFalse(is_valid, f"Expected {num} to be invalid")
            self.assertIsNotNone(err)

class PasswordValidationTests(TestCase):
    def test_valid_passwords(self):
        valid_passwords = [
            "password123",
            "Admin123",
            "Secr3t",
            "Pneumo2026",
        ]
        for pwd in valid_passwords:
            is_valid, err = validate_password(pwd)
            self.assertTrue(is_valid, f"Expected {pwd} to be valid, got error: {err}")
            self.assertIsNone(err)

    def test_invalid_passwords(self):
        invalid_passwords = [
            "",              # Empty
            "12345",         # Short (< 6)
            "abcde",         # Short (< 6)
            "123456",        # No letters
            "abcdef",        # No numbers
        ]
        for pwd in invalid_passwords:
            is_valid, err = validate_password(pwd)
            self.assertFalse(is_valid, f"Expected {pwd} to be invalid")
            self.assertIsNotNone(err)


