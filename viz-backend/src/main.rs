use std::{
    collections::{HashMap, HashSet},
    sync::Arc,
};

use argon2::{Argon2, PasswordHash, PasswordVerifier};
use axum::{Json, Router, extract::State, http::StatusCode};
use axum_extra::{TypedHeader, headers};
use chrono::{Duration, Utc};
use jsonwebtoken::{DecodingKey, EncodingKey, Header, Validation};
use reqwest::header::{AUTHORIZATION, CONTENT_TYPE};
use serde::{Deserialize, Serialize};
use tokio::sync::Mutex;
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
// user: a
// password: p
const PASSWORD_HASH: &str =
    "$argon2i$v=19$m=16,t=2,p=1$c0JIVW1XVW82R2tjdEFybQ$uOn0m1pZKN5xPis3UIn+mw";

const TOKEN_SECRET: &str = "my-super-secret";

#[tokio::main(flavor = "current_thread")]
async fn main() -> Result<(), std::io::Error> {
    let app_state = AppState {};

    let app = Router::new()
        .route("/api/v1/story/new", axum::routing::get(fetch_story))
        .route("/api/login", axum::routing::post(login))
        .with_state(Arc::new(app_state));

    let listener = tokio::net::TcpListener::bind("0.0.0.0:8084").await?;
    axum::serve(listener, app).await
}

async fn fetch_story(
    State(_state): State<Arc<AppState>>,
    TypedHeader(auth): TypedHeader<headers::Authorization<headers::authorization::Bearer>>,
) -> Result<Json<Story>, StatusCode> {
    let incoming_token = auth.token();

    let decoding_key = DecodingKey::from_secret(TOKEN_SECRET.as_ref());
    let token_data =
        jsonwebtoken::decode::<Claims>(incoming_token, &decoding_key, &Validation::default())
            .map_err(|_| StatusCode::UNAUTHORIZED)?;

    println!("User {} authorized to read a story", token_data.claims.sub);

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

struct AppState {
    // TODO, empty for now
}

async fn login(
    State(_state): State<Arc<AppState>>,
    Json(payload): Json<LoginRequest>,
) -> Result<Json<LoginResponse>, StatusCode> {
    if payload.username != "a" {
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
        &EncodingKey::from_secret(TOKEN_SECRET.as_ref()),
    )
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(LoginResponse { token }))
}
