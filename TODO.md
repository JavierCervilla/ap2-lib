# Mandates

## Crypto

Reemplazar la fase firma para seguir lo requerido por la especifficacion:
    - CartMandate

    ```python
    merchant_authorization: Optional[str] = Field(
      None,
      description=(""" A base64url-encoded JSON Web Token (JWT) that digitally
        signs the cart contents, guaranteeing its authenticity and integrity:
        1. Header includes the signing algorithm and key ID.
        2. Payload includes:
          - iss, sub, aud: Identifiers for the merchant (issuer)
            and the intended recipient (audience), like a payment processor.
          - iat: iat, exp: Timestamps for the token's creation and its
            short-lived expiration (e.g., 5-15 minutes) to enhance security.
          - jti: Unique identifier for the JWT to prevent replay attacks.
          - cart_hash: A secure hash of the CartMandate, ensuring
             integrity. The hash is computed over the canonical JSON
             representation of the CartContents object.
        3. Signature: A digital signature created with the merchant's private
          key. It allows anyone with the public key to verify the token's
          authenticity and confirm that the payload has not been tampered with.
        The entire JWT is base64url encoded to ensure safe transmission.
        """
        ),
      example="eyJhbGciOiJSUzI1NiIsImtpZCI6IjIwMjQwOTA...",  # Example JWT
  )
  ```


## PaymentMandate

[] Crear PaymentMandate siguiendo la especificacion

```python
class PaymentMandateContents(BaseModel):
  """The data contents of a PaymentMandate."""

  payment_mandate_id: str = Field(
      ..., description="A unique identifier for this payment mandate."
  )
  payment_details_id: str = Field(
      ..., description="A unique identifier for the payment request."
  )
  payment_details_total: PaymentItem = Field(
      ..., description="The total payment amount."
  )
  payment_response: PaymentResponse = Field(
      ...,
      description=(
          "The payment response containing details of the payment method chosen"
          " by the user."
      ),
  )
  merchant_agent: str = Field(..., description="Identifier for the merchant.")
  timestamp: str = Field(
      description=(
          "The date and time the mandate was created, in ISO 8601 format."
      ),
      default_factory=lambda: datetime.now(timezone.utc).isoformat(),
  )


class PaymentMandate(BaseModel):
  """Contains the user's instructions & authorization for payment.

  While the Cart and Intent mandates are required by the merchant to fulfill the
  order, separately the protocol provides additional visibility into the agentic
  transaction to the payments ecosystem. For this purpose, the PaymentMandate
  (bound to Cart/Intent mandate but containing separate information) may be
  shared with the network/issuer along with the standard transaction
  authorization messages. The goal of the PaymentMandate is to help the
  network/issuer build trust into the agentic transaction.
  """

  payment_mandate_contents: PaymentMandateContents = Field(
      ...,
      description="The data contents of the payment mandate.",
  )
  user_authorization: Optional[str] = Field(
      None,
      description=(
          """
          This is a base64_url-encoded verifiable presentation of a verifiable
          credential signing over the cart_mandate and payment_mandate_hashes.
          For example an sd-jwt-vc would contain:

          - An issuer-signed jwt authorizing a 'cnf' claim
          - A key-binding jwt with the claims
            "aud": ...
            "nonce": ...
            "sd_hash": hash of the issuer-signed jwt
            "transaction_data": an array containing the secure hashes of 
              CartMandate and PaymentMandateContents.

          """
      ),
      example="eyJhbGciOiJFUzI1NksiLCJraWQiOiJkaWQ6ZXhhbXBsZ...",
  )
```

## Utilizar W3C PaymentRequestApi
sustituir el uso de 
https://developer.mozilla.org/en-US/docs/Web/API/Payment_Request_API
https://developer.mozilla.org/en-US/docs/Web/API/PaymentRequest/PaymentRequest

