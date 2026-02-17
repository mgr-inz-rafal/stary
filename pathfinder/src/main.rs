#[allow(dead_code)]
pub mod shared {
    include!(concat!(env!("OUT_DIR"), "/shared.rs"));
}

use shared::Point2d;

fn main() {
    let point = Point2d { x: 10., y: 20. };

    println!("Point: {:?}", point);
}
