use argon2::{Argon2, PasswordHash, PasswordVerifier};
use axum::{Json, Router, http::StatusCode};
use axum_extra::{TypedHeader, headers};
use chrono::{Duration, Utc};
use jsonwebtoken::{EncodingKey, Header};
use reqwest::header::{AUTHORIZATION, CONTENT_TYPE};
use serde::{Deserialize, Serialize};
use tower_http::cors::{AllowOrigin, CorsLayer};

#[allow(dead_code)]
pub mod shared {
    include!(concat!(env!("OUT_DIR"), "/shared.rs"));
}

use shared::Story;

#[derive(Deserialize)]
struct LoginRequest {
    username: String,
    password: String,
}

#[derive(Serialize)]
struct LoginResponse {
    token: String,
}

#[derive(Serialize, Deserialize)]
struct Claims {
    sub: String,
    exp: usize,
}

// TODO: Hardcoded for dev purposes
// user: admin
// password: password123
const PASSWORD_HASH: &str =
    "$argon2i$v=19$m=16,t=2,p=1$N0FMbU9yVWR1ODV2eVhYdA$F3uBtcyPeKwFQ6vqlmmxUw";

#[tokio::main(flavor = "current_thread")]
async fn main() -> Result<(), std::io::Error> {
    let app = Router::new()
        .route("/api/v1/story/new", axum::routing::get(fetch_story))
        .route("/login", axum::routing::post(login))
        .layer(
            CorsLayer::new()
                // TODO: Do not use `any` once auth is up and running
                .allow_origin(AllowOrigin::any())
                .allow_headers([AUTHORIZATION, CONTENT_TYPE]),
        );

    let listener = tokio::net::TcpListener::bind("0.0.0.0:8084").await?;
    axum::serve(listener, app).await
}

async fn fetch_story(
    TypedHeader(auth): TypedHeader<headers::Authorization<headers::authorization::Bearer>>,
) -> Result<Json<Story>, StatusCode> {
    let token = auth.token();

    if !verify_token(token) {
        return Err(StatusCode::UNAUTHORIZED);
    }

    let client = reqwest::Client::new();

    let Ok(response) = client
        .get("http://localhost:8083/api/v1/story/new")
        .send()
        .await
    else {
        return Err(StatusCode::INTERNAL_SERVER_ERROR);
    };

    let Ok(story) = response.json::<Story>().await else {
        return Err(StatusCode::INTERNAL_SERVER_ERROR);
    };

    Ok(Json(story))
}

fn verify_token(token: &str) -> bool {
    println!("Verifying token: {token}");
    false
}

async fn login(Json(payload): Json<LoginRequest>) -> Result<Json<LoginResponse>, StatusCode> {
    if payload.username != "admin" {
        return Err(StatusCode::UNAUTHORIZED);
    }

    let parsed_hash =
        PasswordHash::new(PASSWORD_HASH).map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let argon2 = Argon2::default();

    if argon2
        .verify_password(payload.password.as_bytes(), &parsed_hash)
        .is_err()
    {
        return Err(StatusCode::UNAUTHORIZED);
    }

    let expiration = Utc::now()
        .checked_add_signed(Duration::days(7))
        .unwrap()
        .timestamp() as usize;

    let claims = Claims {
        sub: payload.username,
        exp: expiration,
    };

    let token = jsonwebtoken::encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret("my-secret".as_ref()), // TODO: fixme
    )
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(LoginResponse { token }))
}
