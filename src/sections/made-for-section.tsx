import Image from "next/image";
import { SectionHeading } from "@/components/section-heading";
import { Reveal } from "@/components/reveal";
import { shimmerDataUrl } from "@/lib/image-placeholder";

export function MadeForSection() {
  return (
    <section id="made-for" className="bg-[#030712] px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Heritage"
          title="Rooted in Excellence"
          description="ORION is built for institutions that take education, innovation, and student outcomes seriously."
        />

        <div className="mt-16 grid gap-6 lg:grid-cols-2">
          <Reveal>
            <article className="group h-full rounded-2xl border border-white/10 bg-[#111827] p-8 transition-colors hover:border-[#00FF88]/30">
              <div className="mb-8 flex items-center justify-center overflow-hidden rounded-xl bg-black/20 p-6">
                <Image
                  src="/images/mrgi-logo.png"
                  alt="Malla Reddy Group of Institutions Logo"
                  width={300}
                  height={255}
                  loading="lazy"
                  placeholder="blur"
                  blurDataURL={shimmerDataUrl(300, 255)}
                  className="h-auto w-40 object-contain transition-transform duration-500 group-hover:scale-105 sm:w-52"
                />
              </div>
              <h3 className="text-xl font-semibold text-[#F9FAFB]">
                Made for MRGI
              </h3>
              <p className="mt-3 text-[#9CA3AF]">
                Malla Reddy Group of Institutions (MRGI) is one of
                India&apos;s largest and most respected education networks,
                offering engineering, management, medical, and pharmacy
                programs across multiple campuses. Renowned for academic
                excellence, industry-aligned curricula, and state-of-the-art
                infrastructure, MRGI has consistently produced
                industry-ready graduates. With a strong emphasis on
                innovation, research, and holistic student development, MRGI
                continues to shape the next generation of engineers, leaders,
                and professionals.
              </p>
            </article>
          </Reveal>

          <Reveal delay={0.1}>
            <article className="group h-full rounded-2xl border border-white/10 bg-[#111827] p-8 transition-colors hover:border-[#00FF88]/30">
              <div className="mb-8 flex items-center justify-center overflow-hidden rounded-xl bg-black/20">
                <Image
                  src="/images/founder.jpg"
                  alt="Dr. Malla Reddy, Founder Chairman"
                  width={5060}
                  height={5750}
                  loading="lazy"
                  placeholder="blur"
                  blurDataURL={shimmerDataUrl(506, 575)}
                  sizes="(max-width: 768px) 60vw, 320px"
                  className="h-64 w-auto object-cover object-top transition-transform duration-500 group-hover:scale-105 sm:h-72"
                />
              </div>
              <h3 className="text-xl font-semibold text-[#F9FAFB]">
                Inspired by Leadership
              </h3>
              <p className="mt-3 text-[#9CA3AF]">
                Dr. Malla Reddy, Founder Chairman of the Malla Reddy Group of
                Institutions, is a visionary educationist whose lifelong
                commitment to accessible, quality education has transformed
                the higher-education landscape in Telangana. Starting from
                humble beginnings, he built one of the country&apos;s largest
                private education networks, driven by the belief that
                education is the most powerful tool for social and economic
                transformation. His leadership continues to inspire a
                culture of discipline, innovation, and excellence across
                every institution he founded.
              </p>
            </article>
          </Reveal>
        </div>
      </div>
    </section>
  );
}