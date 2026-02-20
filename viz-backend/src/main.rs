use axum::{Json, Router, http::StatusCode};
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
        .layer(CorsLayer::new().allow_origin(AllowOrigin::any()));

    let listener = tokio::net::TcpListener::bind("0.0.0.0:8084").await?;
    axum::serve(listener, app).await
}

async fn fetch_story() -> (StatusCode, Json<Option<Story>>) {
    let client = reqwest::Client::new();

    let Ok(response) = client
        .get("http://localhost:8083/api/v1/story/new")
        .send()
        .await
    else {
        return (StatusCode::INTERNAL_SERVER_ERROR, Json(None));
    };

    let Ok(story) = response.json::<Story>().await else {
        return (StatusCode::INTERNAL_SERVER_ERROR, Json(None));
    };

    (StatusCode::CREATED, Json(Some(story)))
}
