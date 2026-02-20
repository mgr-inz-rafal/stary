use axum::{Json, Router, http::StatusCode};
use axum_extra::{TypedHeader, headers};
use reqwest::header::{AUTHORIZATION, CONTENT_TYPE};
use tower_http::cors::{AllowOrigin, CorsLayer};

#[allow(dead_code)]
pub mod shared {
    include!(concat!(env!("OUT_DIR"), "/shared.rs"));
}

use shared::Story;

#[tokio::main(flavor = "current_thread")]
async fn main() -> Result<(), std::io::Error> {
    let app = Router::new()
        .route("/api/v1/story/new", axum::routing::get(fetch_story))
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
