#[allow(dead_code)]
pub mod shared {
    include!(concat!(env!("OUT_DIR"), "/shared.rs"));
}

use shared::Point;

fn main() {
    let point = Point {
        x: 10.,
        y: 20.,
        z: 0.,
    };

    println!("Point: {:?}", point);
}
